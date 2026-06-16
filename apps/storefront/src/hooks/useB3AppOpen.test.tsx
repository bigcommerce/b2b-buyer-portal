import { screen, waitFor } from '@testing-library/react';
import { buildCompanyStateWith, userEvent } from 'tests/test-utils';
import { renderHookWithProviders } from 'tests/utils/hook-test-utils';

import { CustomerRole } from '@/types';

import { useB3AppOpen } from './useB3AppOpen';

const loggedInCompanyState = buildCompanyStateWith({
  customer: {
    id: 123,
    role: CustomerRole.ADMIN,
  },
});

describe('useB3AppOpen native storefront link interception', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    window.history.pushState({}, '', '/');
  });

  it('intercepts child clicks inside account anchors', async () => {
    document.body.innerHTML = `
      <a class="navUser-action" href="${window.location.origin}/account.php?action=order_status">
        <span class="navUser-item-accountLabel">Account</span>
      </a>
    `;
    const handleEnterClick = vi.fn();

    renderHookWithProviders(
      () =>
        useB3AppOpen({
          isOpen: false,
          handleEnterClick,
          authorizedPages: '/orders',
        }),
      { preloadedState: { company: loggedInCompanyState } },
    );

    await userEvent.click(screen.getByText('Account'));

    await waitFor(() => {
      expect(handleEnterClick).toHaveBeenCalledWith('/account.php?action=order_status', false);
    });
  });

  it('intercepts same-origin absolute account links without navUser classes', async () => {
    document.body.innerHTML = `
      <li class="menu-item">
        <a href="${window.location.origin}/account.php">Account</a>
      </li>
    `;
    const handleEnterClick = vi.fn();

    renderHookWithProviders(
      () =>
        useB3AppOpen({
          isOpen: false,
          handleEnterClick,
          authorizedPages: '/orders',
        }),
      { preloadedState: { company: loggedInCompanyState } },
    );

    await userEvent.click(screen.getByRole('link'));

    await waitFor(() => {
      expect(handleEnterClick).toHaveBeenCalledWith('/account.php', false);
    });
  });

  it('does not intercept checkout placeholder links', async () => {
    window.history.pushState({}, '', '/checkout');
    document.body.innerHTML = '<a href="#">Continue</a>';
    const handleEnterClick = vi.fn();

    renderHookWithProviders(
      () =>
        useB3AppOpen({
          isOpen: false,
          handleEnterClick,
          authorizedPages: '/orders',
        }),
      { preloadedState: { company: loggedInCompanyState } },
    );

    await userEvent.click(screen.getByRole('link'));

    // Drain microtasks before asserting absence
    await Promise.resolve();

    expect(handleEnterClick).not.toHaveBeenCalled();
  });
});
