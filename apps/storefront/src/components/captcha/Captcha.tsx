import { useEffect, useMemo, useRef } from 'react';

import { themeFrameSelector, useAppSelector } from '@/store';

// eslint-disable-next-line
import FRAME_HANDLER_CODE from './frameCaptchaCode.js?raw'

const CAPTCHA_URL = 'https://www.google.com/recaptcha/api.js?render=explicit';
const CAPTCHA_VARIABLES: Record<string, string> = {
  PREFIX: '',
  PARENT_ORIGIN: window.location.origin,
  CAPTCHA_SUCCESS: 'captcha-success',
  CAPTCHA_ERROR: 'captcha-error',
  CAPTCHA_EXPIRED: 'captcha-expired',
};

export interface CaptchaProps {
  siteKey: string;
  size?: 'compact' | 'normal';
  theme?: 'dark' | 'light';
  email?: string;
  handleGetKey: (arg: string) => void;
}

export function loadCaptchaScript(iframeDocument: HTMLIFrameElement['contentDocument']) {
  if (iframeDocument?.head.querySelector(`script[src="${CAPTCHA_URL}"]`) === null) {
    const captchaScript = iframeDocument.createElement('script');
    captchaScript.src = CAPTCHA_URL;
    iframeDocument.head.appendChild(captchaScript);
  }
}

export function loadCaptchaWidgetHandlers(
  iframeDocument: HTMLIFrameElement['contentDocument'],
  widgetId: string,
) {
  if (!iframeDocument) return;

  let code = FRAME_HANDLER_CODE;

  CAPTCHA_VARIABLES.PREFIX = widgetId;

  Object.entries(CAPTCHA_VARIABLES).forEach(([key, value]) => {
    code = code.replace(RegExp(key, 'g'), value);
  });

  const handlerScript = iframeDocument.createElement('script');
  handlerScript.textContent = code;
  iframeDocument.head.appendChild(handlerScript);
}

export function generateWidgetId() {
  return `widget_${Date.now()}`;
}

export function Captcha(props: CaptchaProps) {
  const { theme, size, email, handleGetKey, siteKey } = props;
  const iframeDocument = useAppSelector(themeFrameSelector);
  const widgetId = useMemo(() => generateWidgetId(), []);
  const initialized = useRef(false);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event?.data?.startsWith?.(widgetId)) {
        const message = event.data.slice(widgetId.length);
        const data = JSON.parse(message);

        const key = data.payload;
        switch (data.type) {
          case CAPTCHA_VARIABLES.CAPTCHA_SUCCESS:
            if (key) {
              handleGetKey(key);
            }
            break;

          default:
            break;
        }
      }
    };

    window.addEventListener('message', onMessage, false);

    return () => {
      if (initialized.current) {
        window.removeEventListener('message', onMessage);
      }
    };
  }, [email, widgetId, handleGetKey]);

  useEffect(() => {
    if (iframeDocument === undefined || initialized.current) {
      return;
    }

    loadCaptchaScript(iframeDocument);
    loadCaptchaWidgetHandlers(iframeDocument, widgetId);
    initialized.current = true;
  }, [iframeDocument, widgetId]);

  return <div id={widgetId} data-sitekey={siteKey} data-theme={theme} data-size={size} />;
}
