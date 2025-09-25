import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen, waitFor } from 'tests/test-utils';

import * as hooks from '@/hooks';
import * as bcService from '@/shared/service/bc';
import { snackbar } from '@/utils';
import * as loginInfo from '@/utils/loginInfo';

import LoginPage from './index';
import * as logoutHooks from './useLogout';

describe('LoginPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  const renderLogin = () => renderWithProviders(<LoginPage setOpenPage={vi.fn()} />);

  it('renders login form and submits successfully', async () => {
    vi.spyOn(bcService, 'bcLogin').mockResolvedValue({ errors: undefined });
    vi.spyOn(bcService, 'b2bLogin').mockResolvedValue({
      login: {
        result: {
          token: '123',
          storefrontLoginToken: '456',
          permissions: [{ code: '1', permissionLevel: 1 }],
        },
        errors: undefined,
      },
    });
    vi.spyOn(bcService, 'customerLoginAPI').mockImplementation(() => {});
    vi.spyOn(loginInfo, 'getCurrentCustomerInfo').mockResolvedValue({
      userType: 5,
      role: 2,
      companyRoleName: 'Junior Buyer',
    });
    vi.spyOn(hooks, 'dispatchEvent').mockResolvedValue(false);
    const { navigation } = renderLogin();
    await userEvent.type(screen.getByLabelText(/Email address/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/Password/i), 'Password123');
    await userEvent.keyboard('{Enter}');
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
    await waitFor(() => {
      expect(navigation).toHaveBeenCalledWith(expect.stringMatching(/\/shoppingLists/));
    });
  });

  it('shows error message on invalid login details', async () => {
    vi.spyOn(bcService, 'bcLogin').mockImplementation(() => {
      throw new Error('Invalid login');
    });
    vi.spyOn(hooks, 'dispatchEvent').mockResolvedValue(false);
    const snackbarErrorSpy = vi.spyOn(snackbar, 'error').mockImplementation(() => {});
    renderLogin();
    await userEvent.type(screen.getByLabelText(/Email address/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/Password/i), 'Password123');
    await userEvent.keyboard('{Enter}');
    await waitFor(() => {
      expect(snackbarErrorSpy).toHaveBeenCalledWith(
        "Your email address or password is incorrect. Please try again. If you've forgotten your sign in details, just click the 'Forgot your password?' link below.",
      );
    });
    snackbarErrorSpy.mockRestore();
  });

  describe('Pending Approval Scenario', () => {
    let snackbarErrorSpy: ReturnType<typeof vi.spyOn>;
    const logoutMock = vi.fn();

    beforeEach(() => {
      vi.spyOn(bcService, 'bcLogin').mockResolvedValue({ errors: undefined });
      vi.spyOn(bcService, 'customerLoginAPI').mockImplementation(() => {});
      snackbarErrorSpy = vi.spyOn(snackbar, 'error').mockImplementation(() => {});
      vi.spyOn(logoutHooks, 'useLogout').mockReturnValue(logoutMock);
    });

    afterEach(() => {
      snackbarErrorSpy.mockRestore();
      vi.resetAllMocks();
    });

    const renderPrefilledLogin = async () => {
      renderLogin();
      await userEvent.type(screen.getByLabelText(/Email address/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/Password/i), 'Password123');
      await userEvent.keyboard('{Enter}');
      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });
    };

    it('shows features, products, and pricing after account approval message and logs out without notification', async () => {
      vi.spyOn(bcService, 'b2bLogin').mockImplementation(() => {
        throw new Error(
          'Your business account is pending approval. You will gain access to business account features, products, and pricing after account approval.',
        );
      });

      await renderPrefilledLogin();

      await waitFor(() => {
        expect(snackbarErrorSpy).toHaveBeenCalledWith(
          'Your business account is pending approval. You will gain access to business account features, products, and pricing after account approval.',
        );
      });
      await waitFor(() => {
        expect(logoutMock).toHaveBeenCalledWith(false);
      });
    });

    it('shows Products, pricing, and ordering will be enabled after account approval message and logs out without notification', async () => {
      vi.spyOn(bcService, 'b2bLogin').mockImplementation(() => {
        throw new Error(
          'Your business account is pending approval. Products, pricing, and ordering will be enabled after account approval.',
        );
      });

      await renderPrefilledLogin();

      await waitFor(() => {
        expect(snackbarErrorSpy).toHaveBeenCalledWith(
          'Your business account is pending approval. Products, pricing, and ordering will be enabled after account approval.',
        );
      });
      await waitFor(() => {
        expect(logoutMock).toHaveBeenCalledWith(false);
      });
    });

    it('shows will gain access to business account features after account approval message and logs out without notification', async () => {
      vi.spyOn(bcService, 'b2bLogin').mockImplementation(() => {
        throw new Error(
          'Your business account is pending approval. You will gain access to business account features after account approval.',
        );
      });

      await renderPrefilledLogin();

      await waitFor(() => {
        expect(snackbarErrorSpy).toHaveBeenCalledWith(
          'Your business account is pending approval. You will gain access to business account features after account approval.',
        );
      });
      await waitFor(() => {
        expect(logoutMock).toHaveBeenCalledWith(false);
      });
    });
  });
});
