import { Component, ReactNode, RefObject } from 'react'
import { CssBaseline } from '@mui/material'
import { createPortal } from 'react-dom'
import createCache, { EmotionCache } from '@emotion/cache'
import { CacheProvider } from '@emotion/react'

export function IFrameSetContent(
  el: HTMLIFrameElement | null,
  content: string,
  forceWrite: boolean = false,
) {
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
}

interface ThemeFrameState {
  hasError: boolean
  title: string
  emotion?: EmotionCache
}

const DefaultIframeContent = '<!DOCTYPE html><html><head></head><body></body></html>'
export class ThemeFrame extends Component<ThemeFrameProps, ThemeFrameState> {
  _iframeSetupComplete: boolean

  node: HTMLIFrameElement | null

  constructor(props: ThemeFrameProps) {
    super(props)

    this._iframeSetupComplete = false
    this.node = null
    this.state = {
      hasError: false,
      title: btoa(Date.now().toString()),
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
      customStyleElement.appendChild(
        document.createTextNode(this.props.customStyles),
      )
      doc.head.appendChild(customStyleElement)
    }

    const emotion = createCache({
      container: doc.head,
      key: 'css',
      prepend: true,
    })

    this.setState({
      emotion,
    })

    if (doc.readyState === 'complete') {
      this.handleLoad()
    } else {
      this.node?.addEventListener('load', this.handleLoad)
    }

    this._iframeSetupComplete = true
  }

  componentWillUnmount() {
    this._iframeSetupComplete = false
    this.node?.removeEventListener('load', this.handleLoad)
  }

  getIframeDocument = () => (this.node ? this.node.contentDocument : null)

  renderFrameContent = () => {
    if (!this._iframeSetupComplete || this.state.emotion === undefined) {
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
      <CacheProvider value={this.state.emotion}>
        <CssBaseline />
        {this.props.children}
      </CacheProvider>,
      doc.body,
    )
  }

  setNode = (node: HTMLIFrameElement | null) => {
    this.node = node
  }

  handleLoad = () => {
    this.forceUpdate()
  }

  render() {
    const { hasError, title } = this.state

    if (hasError) {
      return null
    }

    return (
      <iframe
        className={this._iframeSetupComplete ? this.props.className : undefined}
        allowFullScreen
        title={title}
        ref={this.setNode}
      >
        {this.renderFrameContent()}
      </iframe>
    )
  }
}
