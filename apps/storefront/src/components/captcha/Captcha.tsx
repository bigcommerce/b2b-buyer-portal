import {
  useEffect, useRef,
} from 'react'
import {
  useSelector,
} from 'react-redux'
import {
  themeFrameSelector,
} from '@/store'
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
export function Captcha(props: CaptchaProps) {
  const {
    siteKey, theme, size, onSuccess, onError, onExpired,
  } = props
  const iframeDocument = useSelector(themeFrameSelector)
  const _widgetId = generateWidgetId()
  const _initialized = useRef(false)

  const onMessage = (event: MessageEvent) => {
    if (event?.data?.startsWith(_widgetId)) {
      const message = event.data.slice(_widgetId.length)
      const data = JSON.parse(message)
      switch (data.type) {
        case CAPTCHA_VARIABLES.CAPTCHA_SUCCESS:
          onSuccess?.()
          break

        case CAPTCHA_VARIABLES.CAPTCHA_ERROR:
          onError?.()
          break

        case CAPTCHA_VARIABLES.CAPTCHA_EXPIRED:
          onExpired?.()
          break

        default:
          break
      }
    }
  }

  useEffect(() => {
    if (iframeDocument === undefined || _initialized.current) {
      return
    }

    loadCaptchaScript(iframeDocument)
    loadCaptchaWidgetHandlers(iframeDocument, _widgetId)
    window.addEventListener('message', onMessage, false)

    _initialized.current = true

    return () => {
      if (_initialized.current) {
        window.removeEventListener('message', onMessage)
      }
    }
  }, [iframeDocument])

  return (
    <div
      id={_widgetId}
      data-sitekey={siteKey}
      data-theme={theme}
      data-size={size}
    />
  )
}
