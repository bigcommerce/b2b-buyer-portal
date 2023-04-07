import {
  ReactNode,
  RefObject,
  useEffect,
  useRef,
  useState,
} from 'react'
import {
  createPortal,
} from 'react-dom'
import {
  useDispatch,
} from 'react-redux'
import createCache, {
  EmotionCache,
} from '@emotion/cache'
import {
  CacheProvider,
} from '@emotion/react'
import {
  CssBaseline,
} from '@mui/material'
import {
  clearThemeFrame, setThemeFrame,
} from '@/store'

export function IFrameSetContent(el: HTMLIFrameElement | null, content: string, forceWrite: boolean = false) {
  if (el) {
    if ('srcdoc' in HTMLIFrameElement.prototype && !forceWrite) {
      el.srcdoc = content
    } else {
      const iframeDoc = el.contentDocument
      iframeDoc?.open('text/html', 'replace')
      iframeDoc?.write(content)
      iframeDoc?.close()
    }
  }
}
const handleLoad = (_iframeRef: RefObject<HTMLIFrameElement>) => {
  // resolve iframe use document mousedown no effect
  if (_iframeRef.current?.contentDocument?.addEventListener) {
    _iframeRef.current.contentDocument.addEventListener('keydown', () => {
      document.dispatchEvent(new Event('keydown'))
    })
    _iframeRef.current.contentDocument.addEventListener('mousedown', () => {
      document.dispatchEvent(new Event('mousedown'))
    })
    _iframeRef.current.contentDocument.addEventListener('touchstart', () => {
      document.dispatchEvent(new Event('touchstart'))
    })
    _iframeRef.current.contentDocument.addEventListener('touchmove', () => {
      document.dispatchEvent(new Event('touchmove'))
    })
    _iframeRef.current.contentDocument.addEventListener('click', () => {
      document.dispatchEvent(new Event('click'))
    })
  }
}

interface ThemeFrameProps {
  children: ReactNode // children to be rendered within iframe
  className?: string // className to assign the iframe
  bodyRef?: RefObject<HTMLBodyElement> // if the parent needs access to body of iframe. i.e to attach dom event handlers
  fontUrl?: string
  customStyles?: string
  title?: string
}
interface ThemeFramePortalProps {
  children: ReactNode
  isSetupComplete: boolean
  emotionCache?: EmotionCache
  iframeDocument?: Document | null
  bodyRef?: RefObject<HTMLBodyElement>
}

const DefaultIframeContent = '<!DOCTYPE html><html><head></head><body></body></html>'

function ThemeFramePortal(props:ThemeFramePortalProps) {
  const dispatch = useDispatch()
  const {
    isSetupComplete, emotionCache, iframeDocument, bodyRef, children,
  } = props

  useEffect(() => {
    if (iframeDocument) {
      dispatch(setThemeFrame(iframeDocument))
    }
    return () => {
      if (iframeDocument) {
        dispatch(clearThemeFrame())
      }
    }
  }, [iframeDocument])

  if (!isSetupComplete || !emotionCache || !iframeDocument) {
    return null
  }

  if (bodyRef?.current !== undefined) {
    // @ts-ignore - we are intentionally setting ref passed from parent
    bodyRef.current = iframeDocument.body
  }

  return createPortal(
    <CacheProvider value={emotionCache}>
      <CssBaseline />
      {children}
    </CacheProvider>,
    iframeDocument.body,
  )
}

export function ThemeFrame(props: ThemeFrameProps) {
  const {
    title, className, fontUrl, customStyles, children, bodyRef,
  } = props
  const _iframeRef = useRef<HTMLIFrameElement>(null)
  const [isSetupComplete, setIsSetupComplete] = useState(false)
  const [emotionCache, setEmotionCache] = useState<EmotionCache|undefined>(undefined)

  useEffect(() => {
    const iframe = _iframeRef.current
    if (!iframe) {
      return
    }

    IFrameSetContent(iframe, DefaultIframeContent, true)
    const doc = _iframeRef.current?.contentDocument
    if (!doc) {
      return
    }

    if (fontUrl) {
      const font = doc.createElement('link')
      font.rel = 'stylesheet'
      font.href = fontUrl
      doc.head.appendChild(font)
    }
    if (customStyles) {
      const customStyleElement = doc.createElement('style')
      customStyleElement.appendChild(document.createTextNode(customStyles))
      doc.head.appendChild(customStyleElement)
    }

    const emotionCacheObj = createCache({
      key: 'css',
      container: doc.head,
      prepend: true,
    })

    setEmotionCache(emotionCacheObj)

    if (doc.readyState === 'complete') {
      handleLoad(_iframeRef)
    } else {
      _iframeRef.current?.addEventListener('load', () => handleLoad(_iframeRef))
    }

    setIsSetupComplete(true)
    return () => {
      setIsSetupComplete(false)
      _iframeRef.current?.removeEventListener('load', () => handleLoad(_iframeRef))
    }
  }, [])

  return (
    <iframe
      allowFullScreen
      className={isSetupComplete ? className : undefined}
      title={title}
      ref={_iframeRef}
    >
      <ThemeFramePortal
        isSetupComplete={isSetupComplete}
        emotionCache={emotionCache}
        iframeDocument={_iframeRef.current?.contentDocument}
        bodyRef={bodyRef}
      >
        {children}
      </ThemeFramePortal>
    </iframe>
  )
}
