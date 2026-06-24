import userEvent from '@testing-library/user-event';
import {
  buildCompanyStateWith,
  buildGlobalStateWith,
  graphql,
  http,
  HttpResponse,
  renderWithProviders,
  screen,
  startMockServer,
  waitFor,
} from 'tests/test-utils';

import { setupStore } from '@/store';
import { clearCompanySlice } from '@/store/slices/company';
import { CustomerRole } from '@/types';
import { snackbar } from '@/utils/b3Tip';
import { getCurrentCustomerInfo } from '@/utils/loginInfo';
import { setDefaultLoginStylingEnabled } from '@/utils/preMountLoginMask';

import LoginPage from './index';
import LoginForm from './LoginForm';
import { useLogout } from './useLogout';

vi.mock('./useLogout', () => ({
  useLogout: vi.fn(() => vi.fn()),
}));

vi.mock('@/utils/loginInfo');

// The BC-first login flow logs failures via b2bLogger (console.error), which
// fails the suite under CI's fail-on-console rule — mock it out.
vi.mock('@/utils/b3Logger');

const { server } = startMockServer();

const ACCOUNT_INCORRECT_MESSAGE =
  "Your email address or password is incorrect. Please try again. If you've forgotten your sign in details, just click the 'Forgot your password?' link below.";

// When the default-login-styling feature flag is on, the login page gates its
// content on `isLogoLoaded` (set true once the merchant login config resolves
// during app init). That flow doesn't run in these unit tests, so default it to
// true — otherwise, if a test enables the flag, the page would stay stuck on the
// loading spinner and never render the form. Tests that specifically care about
// the logo/loaded state can override `initialGlobalContext`.
const renderLoginPage = (options: Parameters<typeof renderWithProviders>[1] = {}) =>
  renderWithProviders(<LoginPage setOpenPage={vi.fn()} />, {
    ...options,
    initialGlobalContext: { isLogoLoaded: true, ...options.initialGlobalContext },
  });

describe('LoginPage', () => {
  beforeEach(() => {
    vi.spyOn(snackbar, 'error');
  });

  describe('successful login and redirects', () => {
    it('should redirect junior buyer to /shoppingLists after successful login', async () => {
      vi.mock('@/hooks/useB2BCallback');

      server.use(
        graphql.mutation('Login', () => {
          return HttpResponse.json({
            data: {
              login: {
                result: {
                  storefrontLoginToken: '456',
                  token: '123',
                  permissions: [{ code: '1', permissionLevel: 1 }],
                },
              },
            },
          });
        }),
      );

      vi.mocked(getCurrentCustomerInfo).mockResolvedValue({
        userType: 5,
        role: 2,
        companyRoleName: 'Junior Buyer',
      });

      const { navigation } = renderLoginPage();

      await userEvent.type(screen.getByLabelText('Email address *'), 'test@example.com');
      await userEvent.type(screen.getByLabelText('Password *'), 'Password123');
      await userEvent.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      await waitFor(() => {
        expect(navigation).toHaveBeenCalledWith(expect.stringContaining('/shoppingLists'));
      });
    });

    it('should redirect SuperAdmin to /dashboard after successful login', async () => {
      vi.mock('@/hooks/useB2BCallback');

      server.use(
        graphql.mutation('Login', () => {
          return HttpResponse.json({
            data: {
              login: {
                result: {
                  storefrontLoginToken: '456',
                  token: '123',
                  permissions: [{ code: '1', permissionLevel: 1 }],
                },
              },
            },
          });
        }),
      );

      vi.mocked(getCurrentCustomerInfo).mockResolvedValue({
        userType: 3,
        role: 3,
        companyRoleName: 'SuperAdmin',
      });

      const { navigation } = renderLoginPage();

      await userEvent.type(screen.getByLabelText('Email address *'), 'test@example.com');
      await userEvent.type(screen.getByLabelText('Password *'), 'Password123');
      await userEvent.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      await waitFor(() => {
        expect(navigation).toHaveBeenCalledWith(expect.stringContaining('/dashboard'));
      });
    });
  });

  describe('failed login attempts show appropriate error messages', () => {
    const renderLoginAndSubmit = async () => {
      renderLoginPage();

      await userEvent.type(screen.getByLabelText('Email address *'), 'test@example.com');
      await userEvent.type(screen.getByLabelText('Password *'), 'Password123');
      await userEvent.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });
    };

    it('should show error message for invalid login credentials', async () => {
      const logoutMock = vi.fn();
      vi.mocked(useLogout).mockReturnValue(logoutMock);

      server.use(
        graphql.mutation('Login', () => {
          return HttpResponse.json({
            errors: [
              {
                message: 'Invalid Login',
              },
            ],
            data: {
              login: null,
            },
          });
        }),
      );

      await renderLoginAndSubmit();

      await waitFor(() => {
        expect(snackbar.error).toHaveBeenCalledWith(
          "Your email address or password is incorrect. Please try again. If you've forgotten your sign in details, just click the 'Forgot your password?' link below.",
        );
      });
    });

    it('should show pending approval message for features/products/pricing and logout silently', async () => {
      const logoutMock = vi.fn();
      vi.mocked(useLogout).mockReturnValue(logoutMock);

      server.use(
        graphql.mutation('Login', () => {
          return HttpResponse.json({
            errors: [
              {
                message:
                  'Your business account is pending approval. You will gain access to business account features, products, and pricing after account approval.',
              },
            ],
            data: {
              login: null,
            },
          });
        }),
      );

      await renderLoginAndSubmit();

      await waitFor(() => {
        expect(snackbar.error).toHaveBeenCalledWith(
          'Your business account is pending approval. You will gain access to business account features, products, and pricing after account approval.',
        );
      });

      await waitFor(() => {
        expect(logoutMock).toHaveBeenCalledWith({ showLogoutBanner: false });
      });
    });

    it('should show pending approval message for products/pricing/ordering and logout silently', async () => {
      const logoutMock = vi.fn();
      vi.mocked(useLogout).mockReturnValue(logoutMock);

      server.use(
        graphql.mutation('Login', () => {
          return HttpResponse.json({
            errors: [
              {
                message:
                  'Your business account is pending approval. Products, pricing, and ordering will be enabled after account approval.',
              },
            ],
            data: {
              login: null,
            },
          });
        }),
      );

      await renderLoginAndSubmit();

      await waitFor(() => {
        expect(snackbar.error).toHaveBeenCalledWith(
          'Your business account is pending approval. Products, pricing, and ordering will be enabled after account approval.',
        );
      });
      await waitFor(() => {
        expect(logoutMock).toHaveBeenCalledWith({ showLogoutBanner: false });
      });
    });

    it('should show pending approval message for business features and logout silently', async () => {
      const logoutMock = vi.fn();
      vi.mocked(useLogout).mockReturnValue(logoutMock);

      server.use(
        graphql.mutation('Login', () => {
          return HttpResponse.json({
            errors: [
              {
                message:
                  'Your business account is pending approval. You will gain access to business account features after account approval.',
              },
            ],
            data: {
              login: null,
            },
          });
        }),
      );

      await renderLoginAndSubmit();

      await waitFor(() => {
        expect(snackbar.error).toHaveBeenCalledWith(
          'Your business account is pending approval. You will gain access to business account features after account approval.',
        );
      });

      await waitFor(() => {
        expect(logoutMock).toHaveBeenCalledWith({ showLogoutBanner: false });
      });
    });

    it('should show inactive account message and logout silently', async () => {
      const logoutMock = vi.fn();
      vi.mocked(useLogout).mockReturnValue(logoutMock);

      server.use(
        graphql.mutation('Login', () => {
          return HttpResponse.json({
            errors: [
              {
                message:
                  'This business account is inactive. Reach out to our support team to reactivate your account.',
              },
            ],
            data: {
              login: null,
            },
          });
        }),
      );

      await renderLoginAndSubmit();

      await waitFor(() => {
        expect(snackbar.error).toHaveBeenCalledWith(
          'This business account is inactive. Reach out to our support team to reactivate your account.',
        );
      });

      await waitFor(() => {
        expect(logoutMock).toHaveBeenCalledWith({ showLogoutBanner: false });
      });
    });
  });

  describe('BC-first login flow (PROJECT-7920.use_bc_login_and_authorisation)', () => {
    const CURRENT_JWT_URL = '*/customer/current.jwt';

    // bcLogin hits the BC storefront GraphQL endpoint while getB2BToken hits the
    // B2B endpoint with an *anonymous* mutation. Scope each handler to its own
    // endpoint so the named 'Login' handler never tries (and warns) on the
    // anonymous B2B operation.
    const bcGraphql = graphql.link(`${window.location.origin}/graphql`);
    const b2bGraphql = graphql.link('https://api-b2b.bigcommerce.com/graphql');

    const renderBcFirstLoginAndSubmit = () => {
      const utils = renderLoginPage({
        preloadedState: {
          global: buildGlobalStateWith({
            featureFlags: { 'PROJECT-7920.use_bc_login_and_authorisation': true },
          }),
        },
      });

      return (async () => {
        await userEvent.type(screen.getByLabelText('Email address *'), 'test@example.com');
        await userEvent.type(screen.getByLabelText('Password *'), 'Password123');
        await userEvent.keyboard('{Enter}');
        return utils;
      })();
    };

    it('stops at BC login and shows the incorrect-account error when credentials are invalid', async () => {
      // BC returns invalid-credentials as HTTP 200 with a populated `errors` array.
      server.use(
        graphql.mutation('Login', () =>
          HttpResponse.json({
            data: { login: null },
            errors: [{ message: 'Invalid credentials' }],
          }),
        ),
        // If the flow wrongly proceeds, these would be hit — they assert the
        // guard short-circuited by failing the test loudly if requested.
        http.get(CURRENT_JWT_URL, () => {
          throw new Error('current.jwt should not be requested after a BC login error');
        }),
      );

      const { navigation } = await renderBcFirstLoginAndSubmit();

      expect(await screen.findByText(ACCOUNT_INCORRECT_MESSAGE)).toBeInTheDocument();
      expect(navigation).not.toHaveBeenCalledWith(expect.stringContaining('/shoppingLists'));
    });

    it('shows the incorrect-account error when the customer JWT cannot be retrieved', async () => {
      server.use(
        graphql.mutation('Login', () =>
          HttpResponse.json({
            data: {
              login: { result: { token: 'bc', storefrontLoginToken: 'sf', permissions: [] } },
            },
          }),
        ),
        // Non-OK response whose body includes "errors" makes getCurrentCustomerJWT
        // resolve to undefined, so fetchB2BTokenByAuthMutation bails on the missing JWT.
        http.get(CURRENT_JWT_URL, () => new HttpResponse('errors', { status: 401 })),
      );

      const { navigation } = await renderBcFirstLoginAndSubmit();

      expect(await screen.findByText(ACCOUNT_INCORRECT_MESSAGE)).toBeInTheDocument();
      expect(navigation).not.toHaveBeenCalledWith(expect.stringContaining('/shoppingLists'));
    });

    it('shows the incorrect-account error when the B2B token exchange fails generically', async () => {
      server.use(
        bcGraphql.mutation('Login', () =>
          HttpResponse.json({
            data: {
              login: { result: { token: 'bc', storefrontLoginToken: 'sf', permissions: [] } },
            },
          }),
        ),
        http.get(CURRENT_JWT_URL, () => HttpResponse.text('jwt-token')),
        // The authorization mutation fails with a generic error, which propagates
        // to handleRegularLogin's catch and surfaces as a snackbar.
        b2bGraphql.operation(() =>
          HttpResponse.json({ errors: [{ message: 'Authorization failed' }] }),
        ),
      );

      const { navigation } = await renderBcFirstLoginAndSubmit();

      await waitFor(() => {
        expect(snackbar.error).toHaveBeenCalledWith(ACCOUNT_INCORRECT_MESSAGE);
      });
      expect(navigation).not.toHaveBeenCalledWith(expect.stringContaining('/shoppingLists'));
    });

    it('shows the company-status error and logs out when the token exchange returns a company error', async () => {
      const logoutMock = vi.fn();
      vi.mocked(useLogout).mockReturnValue(logoutMock);

      const pendingApprovalMessage =
        'Your business account is pending approval. You will gain access to business account features, products, and pricing after account approval.';

      server.use(
        bcGraphql.mutation('Login', () =>
          HttpResponse.json({
            data: {
              login: { result: { token: 'bc', storefrontLoginToken: 'sf', permissions: [] } },
            },
          }),
        ),
        http.get(CURRENT_JWT_URL, () => HttpResponse.text('jwt-token')),
        // getB2BToken maps this to a CompanyError, which handleRegularLogin's
        // catch surfaces as the mapped status message + a silent logout.
        b2bGraphql.operation(() =>
          HttpResponse.json({ errors: [{ message: pendingApprovalMessage }] }),
        ),
      );

      const { navigation } = await renderBcFirstLoginAndSubmit();

      await waitFor(() => {
        expect(snackbar.error).toHaveBeenCalledWith(pendingApprovalMessage);
      });
      await waitFor(() => {
        expect(logoutMock).toHaveBeenCalledWith({ showLogoutBanner: false });
      });
      expect(navigation).not.toHaveBeenCalledWith(expect.stringContaining('/shoppingLists'));
    });

    it('shows the prelaunch error when the token exchange reports the channel is not live', async () => {
      const prelaunchApiMessage =
        'Operation cannot be performed as the storefront channel is not live';
      const prelaunchTip =
        'You can not login to the Buyer Portal while the store is in prelaunch or maintenance mode. Please set the store live, or login inside the customer admin panel.';

      server.use(
        bcGraphql.mutation('Login', () =>
          HttpResponse.json({
            data: {
              login: { result: { token: 'bc', storefrontLoginToken: 'sf', permissions: [] } },
            },
          }),
        ),
        http.get(CURRENT_JWT_URL, () => HttpResponse.text('jwt-token')),
        b2bGraphql.operation(() =>
          HttpResponse.json({ errors: [{ message: prelaunchApiMessage }] }),
        ),
      );

      const { navigation } = await renderBcFirstLoginAndSubmit();

      expect(await screen.findByText(prelaunchTip)).toBeInTheDocument();
      expect(navigation).not.toHaveBeenCalledWith(expect.stringContaining('/shoppingLists'));
    });

    it('exchanges the customer JWT for a B2B token, stores both, and navigates on success', async () => {
      server.use(
        bcGraphql.mutation('Login', () =>
          HttpResponse.json({
            data: {
              login: { result: { token: 'bc', storefrontLoginToken: 'sf', permissions: [] } },
            },
          }),
        ),
        http.get(CURRENT_JWT_URL, () => HttpResponse.text('jwt-token')),
        // The anonymous authorization mutation returns the B2B token, scoped to
        // the B2B endpoint so it only catches the token exchange.
        b2bGraphql.operation(() =>
          HttpResponse.json({ data: { authorization: { result: { token: 'b2b-token' } } } }),
        ),
      );

      vi.mocked(getCurrentCustomerInfo).mockResolvedValue({
        userType: 5,
        role: 2,
        companyRoleName: 'Junior Buyer',
      });

      const { navigation, store } = await renderBcFirstLoginAndSubmit();

      await waitFor(() => {
        expect(navigation).toHaveBeenCalledWith(expect.stringContaining('/shoppingLists'));
      });

      expect(store.getState().company.tokens.B2BToken).toBe('b2b-token');
      expect(store.getState().company.tokens.currentCustomerJWT).toBe('jwt-token');
    });
  });

  describe('loading state prevents duplicate submit', () => {
    it('passes isLoading to LoginForm so Sign In button can be disabled', async () => {
      renderLoginPage();

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      const signInButton = screen.getByRole('button', { name: 'SIGN IN' });
      expect(signInButton).toBeEnabled();
    });
  });

  describe('LoginForm', () => {
    it('disables Sign In button when isLoading is true', () => {
      const handleLoginSubmit = vi.fn();

      renderWithProviders(
        <LoginForm
          loginBtn="SIGN IN"
          handleLoginSubmit={handleLoginSubmit}
          backgroundColor="#FFF"
          isLoading
        />,
      );

      const signInButton = screen.getByRole('button', { name: 'SIGN IN' });
      expect(signInButton).toBeDisabled();
    });

    it('enables Sign In button when isLoading is false', () => {
      const handleLoginSubmit = vi.fn();

      renderWithProviders(
        <LoginForm
          loginBtn="SIGN IN"
          handleLoginSubmit={handleLoginSubmit}
          backgroundColor="#FFF"
          isLoading={false}
        />,
      );

      const signInButton = screen.getByRole('button', { name: 'SIGN IN' });
      expect(signInButton).toBeEnabled();
    });
  });

  describe('URL parameter-driven logout behavior', () => {
    it('should logout with banner when loginFlag=loggedOutLogin and user is logged in', async () => {
      const logoutMock = vi.fn();
      vi.mocked(useLogout).mockReturnValue(logoutMock);

      const preloadedState = {
        company: buildCompanyStateWith({
          customer: {
            role: CustomerRole.ADMIN,
          },
          tokens: {
            B2BToken: 'test-token',
            bcGraphqlToken: '',
            currentCustomerJWT: '',
          },
        }),
      };

      renderLoginPage({
        preloadedState,
        initialEntries: ['/?loginFlag=loggedOutLogin'],
      });

      await waitFor(() => {
        expect(logoutMock).toHaveBeenCalledWith({ showLogoutBanner: true });
      });
    });

    it.each([
      'pendingApprovalToViewPrices',
      'pendingApprovalToOrder',
      'pendingApprovalToAccessFeatures',
      'accountInactive',
      'loggedOutLogin',
    ] as const)(
      'should logout without banner when loginFlag=%s and user is not logged in',
      async (loginFlag) => {
        const logoutMock = vi.fn();
        vi.mocked(useLogout).mockReturnValue(logoutMock);

        // User is not logged in (GUEST role)
        const preloadedState = {
          company: buildCompanyStateWith({
            customer: {
              role: CustomerRole.GUEST,
            },
            tokens: {
              B2BToken: '',
              bcGraphqlToken: '',
              currentCustomerJWT: '',
            },
          }),
        };

        renderLoginPage({
          preloadedState,
          initialEntries: [`/?loginFlag=${loginFlag}`],
        });

        await waitFor(() => {
          expect(logoutMock).toHaveBeenCalledWith({ showLogoutBanner: false });
        });
      },
    );

    it('should not logout when loginFlag is not a logout-triggering flag', async () => {
      const logoutMock = vi.fn();
      vi.mocked(useLogout).mockReturnValue(logoutMock);

      const preloadedState = {
        company: buildCompanyStateWith({
          customer: {
            role: CustomerRole.ADMIN,
          },
          tokens: {
            B2BToken: 'test-token',
            bcGraphqlToken: '',
            currentCustomerJWT: '',
          },
        }),
      };

      renderLoginPage({
        preloadedState,
        initialEntries: ['/?loginFlag=accountIncorrect'],
      });

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      // Should not call logout for flags not in shouldLogout array
      expect(logoutMock).not.toHaveBeenCalled();
    });

    it('should logout only once when loginFlag=loggedOutLogin even after isLoggedIn flips to false', async () => {
      const store = setupStore({
        company: buildCompanyStateWith({
          customer: { role: CustomerRole.ADMIN },
          tokens: { B2BToken: 'test-token', bcGraphqlToken: '', currentCustomerJWT: '' },
        }),
      });

      // Mimic the real logout: clearing the company slice flips the customer
      // role to GUEST, so isLoggedIn becomes false and the effect re-runs. The
      // ref guard must stop that re-run from triggering a second logout (which
      // would wipe the BC storefront token the login flow depends on).
      const logoutMock = vi.fn(async () => {
        store.dispatch(clearCompanySlice());
      });
      vi.mocked(useLogout).mockReturnValue(logoutMock);

      renderLoginPage({ store, initialEntries: ['/?loginFlag=loggedOutLogin'] });

      await waitFor(() => {
        expect(logoutMock).toHaveBeenCalledWith({ showLogoutBanner: true });
      });

      expect(logoutMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('logo rendering', () => {
    it('renders the merchant logo when isLogoLoaded is true and logo is set', async () => {
      const merchantLogoUrl = 'https://cdn.example.com/b2bLogo.png';

      renderLoginPage({
        initialGlobalContext: {
          isLogoLoaded: true,
          logo: merchantLogoUrl,
        },
      });

      const logoImage = await screen.findByAltText('register Logo');
      expect(logoImage).toBeVisible();
      expect(logoImage).toHaveAttribute('src', merchantLogoUrl);
    });
  });

  describe('login config gating', () => {
    // The gate reads the cached feature value synchronously (see
    // isDefaultLoginStylingActive); the cache is optimistic, so an uncached value
    // is treated as active. We control it via localStorage rather than the Redux
    // flag, which is still false on first render before getStoreConfigs resolves.
    const buildGlobalStateWithPageComplete = (isPageComplete: boolean) =>
      buildGlobalStateWith({ isPageComplete });

    afterEach(() => {
      localStorage.clear();
    });

    it('shows the loading spinner and hides the form until the login config has loaded', async () => {
      setDefaultLoginStylingEnabled(true);

      renderWithProviders(<LoginPage setOpenPage={vi.fn()} />, {
        initialGlobalContext: { isLogoLoaded: false },
        preloadedState: { global: buildGlobalStateWithPageComplete(false) },
      });

      // Spinner stays up and the form is not rendered while the config is loading.
      await waitFor(() => {
        expect(screen.getByText('Loading...')).toBeInTheDocument();
      });
      expect(screen.queryByRole('button', { name: 'SIGN IN' })).not.toBeInTheDocument();
    });

    it('renders the login form once the login config has loaded', async () => {
      setDefaultLoginStylingEnabled(true);

      renderWithProviders(<LoginPage setOpenPage={vi.fn()} />, {
        initialGlobalContext: { isLogoLoaded: true },
        preloadedState: { global: buildGlobalStateWithPageComplete(false) },
      });

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });
      expect(screen.getByRole('button', { name: 'SIGN IN' })).toBeInTheDocument();
    });

    it('renders the login form when app init completes even if the config failed to load', async () => {
      // getStoreConfigs failing leaves isLogoLoaded false, but app init still
      // flips isPageComplete true — the form must render rather than leaving the
      // user on an endless spinner with no sign-in form.
      setDefaultLoginStylingEnabled(true);

      renderWithProviders(<LoginPage setOpenPage={vi.fn()} />, {
        initialGlobalContext: { isLogoLoaded: false },
        preloadedState: { global: buildGlobalStateWithPageComplete(true) },
      });

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });
      expect(screen.getByRole('button', { name: 'SIGN IN' })).toBeInTheDocument();
    });

    it('renders the login form immediately when the feature is cached off', async () => {
      // With the feature explicitly off, the form is not gated on isLogoLoaded.
      setDefaultLoginStylingEnabled(false);

      renderWithProviders(<LoginPage setOpenPage={vi.fn()} />, {
        initialGlobalContext: { isLogoLoaded: false },
        preloadedState: { global: buildGlobalStateWithPageComplete(false) },
      });

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });
      expect(screen.getByRole('button', { name: 'SIGN IN' })).toBeInTheDocument();
    });
  });
});
