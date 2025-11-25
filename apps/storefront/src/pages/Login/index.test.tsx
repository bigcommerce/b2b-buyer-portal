import userEvent from '@testing-library/user-event';
import {
  graphql,
  HttpResponse,
  renderWithProviders,
  screen,
  startMockServer,
  waitFor,
} from 'tests/test-utils';

import { snackbar } from '@/utils/b3Tip';
import { getCurrentCustomerInfo } from '@/utils/loginInfo';

import LoginPage from './index';
import { useLogout } from './useLogout';

vi.mock('./useLogout', () => ({
  useLogout: vi.fn(() => vi.fn()),
}));

vi.mock('@/utils/loginInfo');

const { server } = startMockServer();

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

      const { navigation } = renderWithProviders(<LoginPage setOpenPage={vi.fn()} />);

      await userEvent.type(screen.getByLabelText(/Email address/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/Password/i), 'Password123');
      await userEvent.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
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

      const { navigation } = renderWithProviders(<LoginPage setOpenPage={vi.fn()} />);

      await userEvent.type(screen.getByLabelText(/Email address/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/Password/i), 'Password123');
      await userEvent.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      await waitFor(() => {
        expect(navigation).toHaveBeenCalledWith(expect.stringContaining('/dashboard'));
      });
    });
  });

  describe('failed login attempts show appropriate error messages', () => {
    const renderLoginAndSubmit = async () => {
      renderWithProviders(<LoginPage setOpenPage={vi.fn()} />);

      await userEvent.type(screen.getByLabelText(/Email address/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/Password/i), 'Password123');
      await userEvent.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });
    };

    it('should show error message for invalid login credentials', async () => {
      const logoutMock = vi.fn();
      vi.mocked(useLogout).mockImplementation(() => logoutMock);

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
      vi.mocked(useLogout).mockImplementation(() => logoutMock);

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
      vi.mocked(useLogout).mockImplementation(() => logoutMock);

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
      vi.mocked(useLogout).mockImplementation(() => logoutMock);

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
      vi.mocked(useLogout).mockImplementation(() => logoutMock);

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
});
