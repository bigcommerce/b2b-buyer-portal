import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { buildCompanyStateWith } from 'tests/storeStateBuilders';
import { renderHookWithProviders } from 'tests/utils/hook-test-utils';

import { CompanyStatus, CustomerRole } from '@/types';

import b2bVerifyBcLoginStatus from '../../utils/b2bVerifyBcLoginStatus';

import useRegisteredbctob2b from './useRegisteredbctob2b';

vi.mock('../../utils/b2bVerifyBcLoginStatus');
vi.mock('./useDomVariation', () => ({ default: () => [true] }));

const mockedB2bVerifyBcLoginStatus = vi.mocked(b2bVerifyBcLoginStatus);

function setupNavDOM() {
  document.body.innerHTML = `
    <ul class="navUser-section navUser-section--alt">
      <li class="navUser-item navUser-item--account">
        <a class="navUser-action" href="/login.php">Sign In</a>
      </li>
    </ul>
  `;
}

const b2cCustomerState = buildCompanyStateWith({
  customer: {
    id: 123,
    role: CustomerRole.B2C,
  },
  companyInfo: {
    status: CompanyStatus.DEFAULT,
  },
});

describe('useRegisteredbctob2b', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    mockedB2bVerifyBcLoginStatus.mockResolvedValue(true);
  });

  it('renders a "Business Account Application" link in the nav', async () => {
    setupNavDOM();

    renderHookWithProviders(() => useRegisteredbctob2b(vi.fn()), {
      preloadedState: { company: b2cCustomerState },
    });

    const link = await screen.findByRole('link', { name: 'Business Account Application' });
    expect(link).toBeVisible();
    expect(link).toHaveAttribute('href', '/registeredbctob2b');
  });

  it('does not render the link when bc login check returns false', async () => {
    mockedB2bVerifyBcLoginStatus.mockResolvedValue(false);
    setupNavDOM();

    renderHookWithProviders(() => useRegisteredbctob2b(vi.fn()), {
      preloadedState: { company: b2cCustomerState },
    });

    await waitFor(() => {
      expect(
        screen.queryByRole('link', { name: 'Business Account Application' }),
      ).not.toBeInTheDocument();
    });
  });

  it('does not render the link when registration is disabled', async () => {
    setupNavDOM();

    renderHookWithProviders(() => useRegisteredbctob2b(vi.fn()), {
      preloadedState: { company: b2cCustomerState },
      initialGlobalContext: { registerEnabled: false },
    });

    await waitFor(() => {
      expect(
        screen.queryByRole('link', { name: 'Business Account Application' }),
      ).not.toBeInTheDocument();
    });
  });

  it('does not render the link when company status is not DEFAULT', async () => {
    setupNavDOM();

    renderHookWithProviders(() => useRegisteredbctob2b(vi.fn()), {
      preloadedState: {
        company: buildCompanyStateWith({
          customer: { id: 123, role: CustomerRole.B2C },
          companyInfo: { status: CompanyStatus.APPROVED },
        }),
      },
    });

    await waitFor(() => {
      expect(
        screen.queryByRole('link', { name: 'Business Account Application' }),
      ).not.toBeInTheDocument();
    });
  });

  it('opens the Business Account Application page when the link is clicked', async () => {
    setupNavDOM();
    const setOpenPage = vi.fn();

    renderHookWithProviders(() => useRegisteredbctob2b(setOpenPage), {
      preloadedState: { company: b2cCustomerState },
    });

    await userEvent.click(
      await screen.findByRole('link', { name: 'Business Account Application' }),
    );

    expect(setOpenPage).toHaveBeenCalledWith({
      isOpen: true,
      openUrl: '/registeredbctob2b',
    });
  });
});
