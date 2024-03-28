import { ReactNode, RefObject, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import createCache, { EmotionCache } from '@emotion/cache'
import { CacheProvider } from '@emotion/react'
import { CssBaseline } from '@mui/material'

import { clearThemeFrame, setThemeFrame, useAppDispatch } from '@/store'

export function IFrameSetContent(
  el: HTMLIFrameElement | null,
  content: string,
  forceWrite = false
) {
  if (el) {
    const element = el
    if ('srcdoc' in HTMLIFrameElement.prototype && !forceWrite) {
      element.srcdoc = content
    } else {
      const iframeDoc = element.contentDocument
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
  iframeDocument?: HTMLIFrameElement['contentDocument']
  bodyRef?: RefObject<HTMLBodyElement>
}

const DefaultIframeContent =
  '<!DOCTYPE html><html><head></head><body></body></html>'

function ThemeFramePortal(props: ThemeFramePortalProps) {
  const dispatch = useAppDispatch()
  const { isSetupComplete, emotionCache, iframeDocument, bodyRef, children } =
    props

  useEffect(() => {
    if (iframeDocument) {
      dispatch(setThemeFrame(iframeDocument))
    }
    return () => {
      if (iframeDocument) {
        dispatch(clearThemeFrame())
      }
    }
    // disabling because dispatch is not needed in the dependency array
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iframeDocument])

  if (!isSetupComplete || !emotionCache || !iframeDocument) {
    return null
  }

  if (bodyRef?.current !== undefined) {
    // eslint-disable-next-line
    // @ts-ignore - we are intentionally setting ref passed from parent
    bodyRef.current = iframeDocument.body
  }

  return createPortal(
    <CacheProvider value={emotionCache}>
      <CssBaseline />
      {children}
    </CacheProvider>,
    iframeDocument.body
  )
}

export default function ThemeFrame(props: ThemeFrameProps) {
  const { title, className, fontUrl, customStyles, children, bodyRef } = props
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isSetupComplete, setIsSetupComplete] = useState(false)
  const [emotionCache, setEmotionCache] = useState<EmotionCache | undefined>(
    undefined
  )

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) {
      return
    }

    IFrameSetContent(iframe, DefaultIframeContent, true)
    const doc = iframeRef.current?.contentDocument
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
      handleLoad(iframeRef)
    } else {
      iframeRef.current?.addEventListener('load', () => handleLoad(iframeRef))
    }

    setIsSetupComplete(true)
    const currentFrame = iframeRef.current
    // eslint-disable-next-line
    return () => {
      setIsSetupComplete(false)
      currentFrame?.removeEventListener('load', () => {
        handleLoad(iframeRef)
      })
    }
    // disabling cause it needs to be run once
  }, [customStyles, fontUrl])

  useEffect(() => {
    const doc = iframeRef.current?.contentDocument

    if (!doc) {
      return
    }

    if (customStyles) {
      const customStyleElement = doc.createElement('style')
      customStyleElement.appendChild(document.createTextNode(customStyles))
      doc.head.appendChild(customStyleElement)
    }
  }, [customStyles])

  return (
    <iframe
      allowFullScreen
      className={isSetupComplete ? className : undefined}
      title={title}
      ref={iframeRef}
    >
      <ThemeFramePortal
        isSetupComplete={isSetupComplete}
        emotionCache={emotionCache}
        iframeDocument={iframeRef.current?.contentDocument}
        bodyRef={bodyRef}
      >
        {children}
      </ThemeFramePortal>
    </iframe>
  )
}
