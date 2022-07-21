import {
  Component,
  ContextType,
} from 'react'
import {
  ThemeFrameContext,
} from '@/components/ThemeFrame'

const CAPTCHA_URL = 'https://www.google.com/recaptcha/api.js'
const PREFIX = `${Date.now()}|`
const PARENT_ORIGIN = window.location.origin

export interface CaptchaProps {
  siteKey: string
  size?: 'compact'|'normal',
  theme?: 'dark' | 'light',
  onSuccess?: () => void
  onError?: () => void
  onExpired?: () => void
}

export class Captcha extends Component<CaptchaProps> {
  static contextType = ThemeFrameContext

  declare context: ContextType<typeof ThemeFrameContext>

  _initialized: boolean = false

  componentDidMount() {
    if (!this._initialized) {
      this.initializeFrame()
    }
  }

  componentWillUnmount() {
    window.removeEventListener('message', this.onMessage)
  }

  onMessage = (event: MessageEvent) => {
    if (event?.data?.startsWith(`${PREFIX}`)) {
      const message = event.data.slice(PREFIX.length)
      const data = JSON.parse(message)
      switch (data.type) {
        case 'captcha-success':
          this.props.onSuccess?.()
          break

        case 'captcha-error':
          this.props.onError?.()
          break

        case 'captcha-expired':
          this.props.onExpired?.()
          break

        default:
          break
      }
    }
  }

  initializeFrame() {
    const doc = this.context
    if (doc === null || this._initialized) {
      return
    }

    const captchaScript = doc.createElement('script')
    captchaScript.src = CAPTCHA_URL
    doc.head.appendChild(captchaScript)

    const handlerScript = doc.createElement('script')
    handlerScript.innerHTML = `
    window.successCallback = function (token) {
      window.parent.postMessage('${PREFIX}' + JSON.stringify({type: "captcha-success", payload: token}), '${PARENT_ORIGIN}')
    }
    window.expiredCallback = function () {
      window.parent.postMessage('${PREFIX}' + JSON.stringify({type: "captcha-expired", payload: null}), '${PARENT_ORIGIN}')
    }
    window.errorCallback = function () {
      window.parent.postMessage('${PREFIX}' + JSON.stringify({type: "captcha-expired", payload: null}), '${PARENT_ORIGIN}')
    }
    `
    doc.head.appendChild(handlerScript)

    window.addEventListener('message', this.onMessage, false)

    this._initialized = true
  }

  render() {
    this.initializeFrame()

    return (
      <div
        className="g-recaptcha"
        data-sitekey={this.props.siteKey}
        data-theme={this.props.theme}
        data-size={this.props.size}
        data-callback="successCallback"
        data-expired-callback="expiredCallback"
        data-error-callback="errorCallback"
      />
    )
  }
}
