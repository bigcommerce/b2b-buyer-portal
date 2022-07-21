import {
  Component,
  createRef,
  ReactNode,
  RefObject,
} from 'react'
import {
  createPortal,
} from 'react-dom'

import createCache, {
  EmotionCache,
} from '@emotion/cache'
import {
  CacheProvider,
} from '@emotion/react'
import {
  CssBaseline,
} from '@mui/material'

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

interface ThemeFrameProps {
  children: ReactNode // children to be rendered within iframe
  className?: string // className to assign the iframe
  bodyRef?: RefObject<HTMLBodyElement> // if the parent needs access to body of iframe. i.e to attach dom event handlers
  fontUrl?: string
  customStyles?: string
  title?: string
}

interface ThemeFrameState {
  hasError: boolean
  title: string
  emotionCache?: EmotionCache
}

const DefaultIframeContent = '<!DOCTYPE html><html><head></head><body></body></html>'
export class ThemeFrame extends Component<ThemeFrameProps, ThemeFrameState> {
  _setupComplete: boolean

  _iframeRef: RefObject<HTMLIFrameElement>

  constructor(props: ThemeFrameProps) {
    super(props)

    this._setupComplete = false
    this._iframeRef = createRef()
    this.state = {
      hasError: false,
      title: props.title ?? window.btoa(Date.now().toString()),
    }
  }

  static getDerivedStateFromError() {
    return {
      hasError: true,
    }
  }

  componentDidMount() {
    const doc = this.getIframeDocument()
    if (doc === null) {
      return
    }

    IFrameSetContent(
      {
        contentDocument: doc,
      } as HTMLIFrameElement,
      DefaultIframeContent,
      true,
    )

    if (this.props.fontUrl) {
      const font = doc.createElement('link')
      font.rel = 'stylesheet'
      font.href = this.props.fontUrl
      doc.head.appendChild(font)
    }

    if (this.props.customStyles) {
      const customStyleElement = doc.createElement('style')
      customStyleElement.appendChild(document.createTextNode(this.props.customStyles))
      doc.head.appendChild(customStyleElement)
    }

    const emotionCache = createCache({
      key: 'css',
      container: doc.head,
      prepend: true,
    })

    this.setState({
      emotionCache,
    })

    if (doc.readyState === 'complete') {
      this.handleLoad()
    } else {
      this._iframeRef.current?.addEventListener('load', this.handleLoad)
    }

    this._setupComplete = true
  }

  componentWillUnmount() {
    this._setupComplete = false
    this._iframeRef.current?.removeEventListener('load', this.handleLoad)
  }

  getIframeDocument = () => this._iframeRef.current?.contentDocument ?? null

  renderFrameContent = () => {
    if (!this._setupComplete || this.state.emotionCache === undefined) {
      return null
    }

    const doc = this.getIframeDocument()
    if (doc == null) {
      return null
    }

    if (doc.body && this.props.bodyRef) {
      // @ts-ignore - we are intentionally setting ref passed from parent
      this.props.bodyRef.current = doc.body
    }

    return createPortal(
      <CacheProvider value={this.state.emotionCache}>
        <CssBaseline />
        {this.props.children}
      </CacheProvider>,
      doc.body,
    )
  }

  handleLoad = () => {
    this.forceUpdate()
  }

  render() {
    const {
      hasError,
      title,
    } = this.state
    const className = this._setupComplete ? this.props.className : undefined

    if (hasError) {
      return null
    }

    return (
      <iframe
        allowFullScreen
        className={className}
        title={title}
        ref={this._iframeRef}
      >
        {this.renderFrameContent()}
      </iframe>
    )
  }
}
