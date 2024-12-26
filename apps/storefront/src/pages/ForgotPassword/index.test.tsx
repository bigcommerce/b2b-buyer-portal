import {
  assertQueryParams,
  fireEvent,
  http,
  HttpResponse,
  renderWithProviders,
  screen,
  startMockServer,
  waitFor,
} from 'tests/test-utils';

import b2blogger from '@/utils/b3Logger';

import { ForgotPassword } from '.';

vi.mock('@/utils/b3Logger', () => ({ default: { error: vi.fn() } }));

const { server } = startMockServer();

const now = Date.now();

// using fireEvent as a workaround for https://github.com/jsdom/jsdom/issues/2745
const captchaResponse = (
  payload: Record<string, unknown>,
  origin: string,
  source: HTMLIFrameElement,
) => {
  fireEvent(
    window,
    new MessageEvent('message', {
      data: `widget_${now}${JSON.stringify(payload)}`,
      origin,
      source: source.contentWindow,
    }),
  );
};

afterEach(() => {
  vi.useRealTimers();
});

it('shows the header', async () => {
  renderWithProviders(
    <ForgotPassword isEnabledOnStorefront={false} storefrontSiteKey="" setOpenPage={vi.fn()} />,
  );

  screen.getByRole('heading', { name: /reset password/i });
});

it('closes the popover when clicking `close`', async () => {
  const setOpenPage = vi.fn();

  const { user } = renderWithProviders(
    <ForgotPassword isEnabledOnStorefront={false} storefrontSiteKey="" setOpenPage={setOpenPage} />,
  );

  await user.click(screen.getByTestId('CloseIcon'));

  expect(setOpenPage).toHaveBeenCalledWith({
    isOpen: false,
    openUrl: '',
  });
});

describe('when a logo is provided', () => {
  it('is rendered', async () => {
    renderWithProviders(
      <ForgotPassword
        isEnabledOnStorefront={false}
        storefrontSiteKey=""
        setOpenPage={vi.fn()}
        logo="https://foo/bar.png"
      />,
    );

    const logo = screen.getByRole('img', { name: /logo/i });

    expect(logo).toHaveAttribute('src', 'https://foo/bar.png');
  });

  it('navigates to the homepage when the logo is clicked', async () => {
    window.location.hash = '#potato';

    expect(window.location.href).toBe('http://localhost:3000/#potato');

    const { user } = renderWithProviders(
      <ForgotPassword
        isEnabledOnStorefront={false}
        storefrontSiteKey=""
        setOpenPage={vi.fn()}
        logo="https://foo/bar.png"
      />,
    );

    const logo = screen.getByRole('img', { name: /logo/i });

    await user.click(logo);

    expect(window.location.href).toBe('http://localhost:3000/');
  });
});

describe('when a logo is not provided', () => {
  it('is not rendered', () => {
    renderWithProviders(
      <ForgotPassword isEnabledOnStorefront={false} storefrontSiteKey="" setOpenPage={vi.fn()} />,
    );

    expect(screen.queryByRole('img', { name: /logo/i })).not.toBeInTheDocument();
  });
});

describe('when captcha is enabled', () => {
  it('shows an error when the captcha is missing', async () => {
    const iframe = document.createElement('iframe');

    const { user } = renderWithProviders(
      <ForgotPassword isEnabledOnStorefront storefrontSiteKey="foo-bar" setOpenPage={vi.fn()} />,
      {
        preloadedState: {
          theme: {
            themeFrame: iframe.contentWindow?.document,
          },
        },
      },
    );

    const emailInput = screen.getByRole('textbox', { name: /email/i });
    await user.type(emailInput, 'test@example.com');

    const button = screen.getByRole('button', { name: /reset password/i });

    await user.click(button);

    await screen.findByText(/the captcha you entered is incorrect/i);
  });

  it('succeeds when captcha is valid', async () => {
    vi.useFakeTimers({ now, shouldAdvanceTime: true });

    const requestData = vi.fn();

    server.use(
      http.post(
        'https://api-b2b.bigcommerce.com/api/v3/proxy/bc-storefront/graphql',
        async ({ request }) => {
          requestData(await request.json());

          return HttpResponse.json({});
        },
      ),
    );

    const iframe = document.createElement('iframe');

    const { user, navigation } = renderWithProviders(
      <ForgotPassword isEnabledOnStorefront storefrontSiteKey="foo-bar" setOpenPage={vi.fn()} />,
      {
        preloadedState: {
          theme: {
            themeFrame: iframe.contentWindow?.document,
          },
        },
      },
    );

    const emailInput = screen.getByRole('textbox', { name: /email/i });
    await user.type(emailInput, 'test@example.com');

    const button = screen.getByRole('button', { name: /reset password/i });

    captchaResponse(
      {
        payload: 'foo-bar',
        type: 'captcha-success',
      },
      'https://www.google.com',
      iframe,
    );

    await user.click(button);

    await waitFor(() => {
      expect(navigation).toHaveBeenCalledWith('/login?loginFlag=receivePassword');
    });

    expect(requestData).toHaveBeenCalledWith({
      query: expect.any(String),
      variables: {
        email: 'test@example.com',
        token: 'foo-bar',
      },
    });
  });

  it('logs an error if the request to reset password fails', async () => {
    vi.useFakeTimers({ now, shouldAdvanceTime: true });

    server.use(
      http.post('https://api-b2b.bigcommerce.com/api/v3/proxy/bc-storefront/graphql', () => {
        return HttpResponse.error();
      }),
    );

    const iframe = document.createElement('iframe');

    const { user } = renderWithProviders(
      <ForgotPassword isEnabledOnStorefront storefrontSiteKey="foo-bar" setOpenPage={vi.fn()} />,
      {
        preloadedState: {
          theme: {
            themeFrame: iframe.contentWindow?.document,
          },
        },
      },
    );

    await user.type(screen.getByRole('textbox', { name: /email/i }), 'test@example.com');

    captchaResponse(
      {
        payload: 'foo-bar',
        type: 'captcha-success',
      },
      'https://www.google.com',
      iframe,
    );

    await user.click(screen.getByRole('button', { name: /reset password/i }));

    await waitFor(() => {
      expect(b2blogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringMatching(/failed to fetch/i),
        }),
      );
    });
  });
});

describe('when captcha is disabled', () => {
  it('forgot password is sent when email is valid and button is pressed', async () => {
    const serverMock = vi.fn();

    server.use(
      http.post('/bigcommerce/login.php', async ({ request }) => {
        assertQueryParams(request, {
          action: 'send_password_email',
        });

        serverMock(await request.text());

        return HttpResponse.text();
      }),
    );

    const { user, navigation } = renderWithProviders(
      <ForgotPassword
        isEnabledOnStorefront={false}
        storefrontSiteKey="foo-bar"
        setOpenPage={vi.fn()}
      />,
    );

    const emailInput = screen.getByRole('textbox', { name: /email/i });

    await user.type(emailInput, 'test@example.com');

    const button = screen.getByRole('button', { name: /reset password/i });

    await user.click(button);

    expect(serverMock).toHaveBeenCalledWith('email=test%40example.com');
    expect(navigation).toHaveBeenCalledWith('/login?loginFlag=receivePassword');
  });

  it('logs an error when the request to reset password fails', async () => {
    server.use(
      http.post('/bigcommerce/login.php', async ({ request }) => {
        assertQueryParams(request, {
          action: 'send_password_email',
        });
        return HttpResponse.error();
      }),
    );

    const { user } = renderWithProviders(
      <ForgotPassword
        isEnabledOnStorefront={false}
        storefrontSiteKey="foo-bar"
        setOpenPage={vi.fn()}
      />,
    );

    const emailInput = screen.getByRole('textbox', { name: /email/i });

    await user.type(emailInput, 'test@example.com');

    const button = screen.getByRole('button', { name: /reset password/i });

    await user.click(button);

    await waitFor(() => {
      expect(b2blogger.error).toHaveBeenCalledWith(
        'error',
        expect.objectContaining({
          message: expect.stringMatching(/failed to fetch/i),
        }),
      );
    });
  });
});

it('shows a missing email error when the email is missing', async () => {
  const { user, navigation } = renderWithProviders(
    <ForgotPassword isEnabledOnStorefront storefrontSiteKey="foo-bar" setOpenPage={vi.fn()} />,
  );

  const button = screen.getByRole('button', { name: /reset password/i });

  await user.click(button);

  await screen.findByText(/email address is required/i);

  expect(navigation).not.toHaveBeenCalledWith('/login?loginFlag=receivePassword');
});
