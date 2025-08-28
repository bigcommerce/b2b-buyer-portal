import { JSDOM } from 'jsdom';

import { ThemeFrame } from '@/components';
import {
  Captcha,
  loadCaptchaScript,
  loadCaptchaWidgetHandlers,
} from '@/components/captcha/Captcha';
import { renderWithProviders } from 'tests/test-utils';

describe('loadCaptchaScript', () => {
  it('should inject recaptcha script to Document', () => {
    const { window } = new JSDOM();

    loadCaptchaScript(window.document);

    const recaptchaScript = window.document.getElementsByTagName('script')[0];

    expect(recaptchaScript).toMatchObject({
      src: 'https://www.google.com/recaptcha/api.js?render=explicit',
    });
  });
});

describe('loadCaptchaWidgetHandlers', () => {
  it('should inject script', () => {
    const { window } = new JSDOM();

    loadCaptchaWidgetHandlers(window.document, 'testid');

    const recaptchaHandlersScript = window.document.getElementsByTagName('script')[0];

    expect(recaptchaHandlersScript).not.toMatchObject({
      innerHTML: '',
    });
  });

  it('should replace text by id', () => {
    const { window } = new JSDOM();

    loadCaptchaWidgetHandlers(window.document, 'testid');

    const recaptchaHandlersScript = window.document.getElementsByTagName('script')[0];

    expect(recaptchaHandlersScript).toMatchObject({
      innerHTML: expect.stringContaining('testid'),
    });
  });
});

describe('Captcha', () => {
  it('should render the captcha wrapper', async () => {
    const { store } = renderWithProviders(
      <ThemeFrame title="test-frame">
        <Captcha handleGetKey={vi.fn()} siteKey="foo-bar-baz" size="normal" theme="dark" />
      </ThemeFrame>,
    );

    const captchaWrapper = store.getState().theme.themeFrame?.body.getElementsByTagName('div')?.[0];

    expect(captchaWrapper).toHaveAttribute('id', expect.stringMatching(/^widget_/));
    expect(captchaWrapper).toHaveAttribute('data-siteKey', 'foo-bar-baz');
    expect(captchaWrapper).toHaveAttribute('data-theme', 'dark');
    expect(captchaWrapper).toHaveAttribute('data-size', 'normal');
  });
});
