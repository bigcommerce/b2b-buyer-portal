import { useEffect, useMemo, useRef } from 'react';

import { themeFrameSelector, useAppSelector } from '@/store';

// eslint-disable-next-line import/extensions
import FRAME_HANDLER_CODE from './frameCaptchaCode.js?raw';

const CAPTCHA_URL = 'https://www.google.com/recaptcha/api.js?render=explicit';

interface CaptchaProps {
  siteKey: string;
  size?: 'compact' | 'normal';
  theme?: 'dark' | 'light';
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
  if (!iframeDocument) {
    return;
  }

  const handlerScript = iframeDocument.createElement('script');

  const code = FRAME_HANDLER_CODE.replace(/PREFIX/g, widgetId).replace(
    /PARENT_ORIGIN/g,
    window.location.origin,
  );

  handlerScript.textContent = code;
  iframeDocument.head.appendChild(handlerScript);
}

const useWidgetId = () => {
  return useMemo(() => `widget_${Date.now()}`, []);
};

export function Captcha({ theme, size, handleGetKey, siteKey }: CaptchaProps) {
  const iframeDocument = useAppSelector(themeFrameSelector);
  const widgetId = useWidgetId();
  const initialized = useRef(false);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event?.data?.startsWith?.(widgetId)) {
        const message = event.data.slice(widgetId.length);
        const { payload: key, type } = JSON.parse(message);

        if (type === 'CAPTCHA_SUCCESS' && key) {
          handleGetKey(key);
        }
      }
    };

    window.addEventListener('message', onMessage, false);

    return () => {
      if (initialized.current) {
        window.removeEventListener('message', onMessage);
      }
    };
  }, [widgetId, handleGetKey]);

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
