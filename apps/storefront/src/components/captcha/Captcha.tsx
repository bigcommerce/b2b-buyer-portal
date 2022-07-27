import {
  Component,
  ContextType,
} from 'react'
import {
  ThemeFrameContext,
} from '@/components/ThemeFrame'
import FRAME_HANDLER_CODE from './frameCaptchaCode.js?raw'

const CAPTCHA_URL = 'https://www.google.com/recaptcha/api.js?render=explicit'
const CAPTCHA_VARIABLES: Record<string, string> = {
  PREFIX: '',
  PARENT_ORIGIN: window.location.origin,
  CAPTCHA_SUCCESS: 'captcha-success',
  CAPTCHA_ERROR: 'captcha-error',
  CAPTCHA_EXPIRED: 'captcha-expired',
}

export interface CaptchaProps {
  siteKey: string;
  size?: 'compact' | 'normal';
  theme?: 'dark' | 'light';
  onSuccess?: () => void;
  onError?: () => void;
  onExpired?: () => void;
}

export function loadCaptchaScript(iframeDocument: Document) {
  if (iframeDocument.head.querySelector(`script[src="${CAPTCHA_URL}"]`) === null) {
    const captchaScript = iframeDocument.createElement('script')
    captchaScript.src = CAPTCHA_URL
    iframeDocument.head.appendChild(captchaScript)
  }
}

export function loadCaptchaWidgetHandlers(iframeDocument: Document, widgetId: string) {
  let code = FRAME_HANDLER_CODE

  CAPTCHA_VARIABLES.PREFIX = widgetId
  const variableNames = Object.keys(CAPTCHA_VARIABLES)
  for (let i = 0; i < variableNames.length; i += 1) {
    const variableName = variableNames[i]
    code = code.replace(
      RegExp(variableName, 'g'),
      CAPTCHA_VARIABLES[variableName],
    )
  }

  const handlerScript = iframeDocument.createElement('script')
  handlerScript.innerHTML = code
  iframeDocument.head.appendChild(handlerScript)
}

export function generateWidgetId() {
  return `widget_${Date.now()}`
}

export class Captcha extends Component<CaptchaProps> {
  static contextType = ThemeFrameContext

  declare context: ContextType<typeof ThemeFrameContext>

  _initialized: boolean

  _widgetId: string

  constructor(props: CaptchaProps) {
    super(props)

    this._widgetId = generateWidgetId()
    this._initialized = false
  }

  componentDidMount() {
    this.initializeCaptchaInFrame()
  }

  componentWillUnmount() {
    if (this._initialized) {
      window.removeEventListener('message', this.onMessage)
    }
  }

  onMessage = (event: MessageEvent) => {
    if (event?.data?.startsWith(this._widgetId)) {
      const message = event.data.slice(this._widgetId.length)
      const data = JSON.parse(message)
      switch (data.type) {
        case CAPTCHA_VARIABLES.CAPTCHA_SUCCESS:
          this.props.onSuccess?.()
          break

        case CAPTCHA_VARIABLES.CAPTCHA_ERROR:
          this.props.onError?.()
          break

        case CAPTCHA_VARIABLES.CAPTCHA_EXPIRED:
          this.props.onExpired?.()
          break

        default:
          break
      }
    }
  }

  initializeCaptchaInFrame() {
    const iframeDocument = this.context
    if (iframeDocument === null || this._initialized) {
      return
    }

    loadCaptchaScript(iframeDocument)
    loadCaptchaWidgetHandlers(iframeDocument, this._widgetId)
    window.addEventListener('message', this.onMessage, false)

    this._initialized = true
  }

  render() {
    return (
      <div
        id={this._widgetId}
        data-sitekey={this.props.siteKey}
        data-theme={this.props.theme}
        data-size={this.props.size}
      />
    )
  }
}
