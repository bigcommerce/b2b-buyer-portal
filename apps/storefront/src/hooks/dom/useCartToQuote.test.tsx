import { renderHook } from '@testing-library/react';
import { vi } from 'vitest';

import { CART_URL, CHECKOUT_URL } from '@/constants';
import { useAppSelector } from '@/store';
import { CompanyStatus } from '@/types';
import { globalSnackbar } from '@/utils';

import useCartToQuote from './useCartToQuote';

describe('when the user is on checkout page and the company status is rejected', () => {
  beforeEach(() => {
    vi.mock('@/store', () => ({
      useAppSelector: vi.fn(),
    }));
    vi.mock('../useGetButtonText', () => ({
      default: vi.fn(() => 'Add All To Quote'),
    }));
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...window.location, pathname: '', href: '' },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'location', {});
  });

  it('shows an error message', () => {
    vi.mock('@/utils', () => ({
      globalSnackbar: {
        error: vi.fn(),
        warning: vi.fn(),
      },
      B3SStorage: {
        get: vi.fn((key: string) => {
          if (key === 'blockPendingAccountOrderCreation') {
            return 'false';
          }
          if (key === 'sf-isShowBlockPendingAccountOrderCreationTip') {
            return JSON.stringify({ cartTip: 0, checkoutTip: 0 });
          }

          return null;
        }),
      },
    }));

    window.location.pathname = CHECKOUT_URL;
    window.location.href = `http://localhost${CHECKOUT_URL}`;
    vi.mocked(useAppSelector).mockReturnValue(CompanyStatus.REJECTED);

    renderHook(() => useCartToQuote({ setOpenPage: vi.fn(), cartQuoteEnabled: true }));

    expect(globalSnackbar.error).toHaveBeenCalledWith(
      'Your business account has been rejected. Ordering is disabled.',
    );
  });
});

describe('when the user is NOT on checkout page and the company status is rejected', () => {
  it('does not show error message', () => {
    vi.mock('@/utils', () => ({
      globalSnackbar: {
        error: vi.fn(),
        warning: vi.fn(),
      },
      B3SStorage: {
        get: vi.fn((key: string) => {
          if (key === 'blockPendingAccountOrderCreation') {
            return 'false';
          }
          if (key === 'sf-isShowBlockPendingAccountOrderCreationTip') {
            return JSON.stringify({ cartTip: 0, checkoutTip: 0 });
          }

          return null;
        }),
      },
    }));

    window.location.pathname = CART_URL;
    window.location.href = `http://localhost${CART_URL}`;
    vi.mocked(useAppSelector).mockReturnValue(CompanyStatus.REJECTED);

    renderHook(() => useCartToQuote({ setOpenPage: vi.fn(), cartQuoteEnabled: true }));

    expect(globalSnackbar.error).not.toHaveBeenCalledWith(
      'Your business account has been rejected. Ordering is disabled.',
    );
  });
});

describe('when the user is on checkout page and the company status is Approved', () => {
  it('does not an error message', () => {
    vi.mock('@/utils', () => ({
      globalSnackbar: {
        error: vi.fn(),
        warning: vi.fn(),
      },
      B3SStorage: {
        get: vi.fn((key: string) => {
          if (key === 'blockPendingAccountOrderCreation') {
            return 'false';
          }
          if (key === 'sf-isShowBlockPendingAccountOrderCreationTip') {
            return JSON.stringify({ cartTip: 0, checkoutTip: 0 });
          }

          return null;
        }),
      },
    }));

    window.location.pathname = CHECKOUT_URL;
    window.location.href = `http://localhost${CHECKOUT_URL}`;
    vi.mocked(useAppSelector).mockReturnValue(CompanyStatus.APPROVED);

    renderHook(() => useCartToQuote({ setOpenPage: vi.fn(), cartQuoteEnabled: true }));

    expect(globalSnackbar.error).not.toHaveBeenCalledWith(
      'Your business account has been rejected. Ordering is disabled.',
    );
  });
});

describe('when the user is on checkout page and the company status is PENDING', () => {
  it('shows an error message', () => {
    vi.mock('@/utils', () => ({
      globalSnackbar: {
        error: vi.fn(),
        warning: vi.fn(),
      },
      B3SStorage: {
        get: vi.fn((key: string) => {
          if (key === 'blockPendingAccountOrderCreation') {
            return 'false';
          }
          if (key === 'sf-isShowBlockPendingAccountOrderCreationTip') {
            return JSON.stringify({ cartTip: 0, checkoutTip: 0 });
          }

          return null;
        }),
      },
    }));
    window.location.pathname = CHECKOUT_URL;
    window.location.href = `http://localhost${CHECKOUT_URL}`;
    vi.mocked(useAppSelector).mockReturnValue(CompanyStatus.PENDING);

    renderHook(() => useCartToQuote({ setOpenPage: vi.fn(), cartQuoteEnabled: true }));

    expect(globalSnackbar.error).not.toHaveBeenCalledWith(
      'Your account is pending approval. Ordering will be enabled after account approval.',
    );
  });
});
