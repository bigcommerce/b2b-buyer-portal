import { vi } from 'vitest';

import { CART_URL, CHECKOUT_URL } from '@/constants';
import { CompanyStatus } from '@/types';
import { B3SStorage } from '@/utils';
import { buildCompanyStateWith } from 'tests/test-utils';
import { renderHookWithProviders } from 'tests/utils/hook-test-utils';

import useCartToQuote from '../../src/hooks/dom/useCartToQuote';

describe('when the user is on checkout page and the company status is rejected', () => {
  it('shows an error message', () => {
    const mockLocation = {
      href: `http://localhost${CHECKOUT_URL}`,
      pathname: CHECKOUT_URL,
      search: '',
      hash: '',
      assign: vi.fn(),
      replace: vi.fn(),
      reload: vi.fn(),
      ancestorOrigins: {} as DOMStringList,
      host: 'localhost',
      hostname: 'localhost',
      origin: 'http://localhost',
      port: '',
      protocol: 'http:',
    };

    const originalLocation = window.location;

    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true,
    });

    window.globalTipDispatch = vi.fn();

    const preloadedState = {
      company: buildCompanyStateWith({
        companyInfo: {
          status: CompanyStatus.REJECTED,
        },
      }),
    };

    renderHookWithProviders(
      () => useCartToQuote({ setOpenPage: vi.fn(), cartQuoteEnabled: true }),
      { preloadedState },
    );

    expect(window.globalTipDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'globalTip',
        payload: expect.objectContaining({
          globalTipMessage: expect.objectContaining({
            msgs: expect.arrayContaining([
              expect.objectContaining({
                msg: 'Your business account has been rejected. Ordering is disabled.',
              }),
            ]),
          }),
        }),
      }),
    );

    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
    });
  });
});

describe('when the user is NOT on checkout page and the company status is rejected', () => {
  it('does not show error message', () => {
    const mockLocation = {
      href: `http://localhost${CART_URL}`,
      pathname: CART_URL,
      search: '',
      hash: '',
      assign: vi.fn(),
      replace: vi.fn(),
      reload: vi.fn(),
      ancestorOrigins: {} as DOMStringList,
      host: 'localhost',
      hostname: 'localhost',
      origin: 'http://localhost',
      port: '',
      protocol: 'http:',
    };

    const originalLocation = window.location;

    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true,
    });
    window.globalTipDispatch = vi.fn();

    const preloadedState = {
      company: buildCompanyStateWith({
        companyInfo: {
          status: CompanyStatus.REJECTED,
        },
      }),
    };

    const b3sStorageGetSpy = vi.spyOn(B3SStorage, 'get').mockImplementation((key: string) => {
      if (key === 'blockPendingAccountOrderCreation') {
        return 'false';
      }

      if (key === 'sf-isShowBlockPendingAccountOrderCreationTip') {
        return { cartTip: 0, checkoutTip: 0 };
      }

      return undefined;
    });

    renderHookWithProviders(
      () => useCartToQuote({ setOpenPage: vi.fn(), cartQuoteEnabled: true }),
      { preloadedState },
    );

    expect(window.globalTipDispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          globalTipMessage: expect.objectContaining({
            msgs: expect.arrayContaining([
              expect.objectContaining({
                msg: 'Your business account has been rejected. Ordering is disabled.',
              }),
            ]),
          }),
        }),
      }),
    );
    b3sStorageGetSpy.mockRestore();
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
    });
  });
});

describe('when the user is on checkout page and the company status is Approved', () => {
  it('does not show an error message', () => {
    const mockLocation = {
      href: `http://localhost${CHECKOUT_URL}`,
      pathname: CHECKOUT_URL,
      search: '',
      hash: '',
      assign: vi.fn(),
      replace: vi.fn(),
      reload: vi.fn(),
      ancestorOrigins: {} as DOMStringList,
      host: 'localhost',
      hostname: 'localhost',
      origin: 'http://localhost',
      port: '',
      protocol: 'http:',
    };

    const originalLocation = window.location;

    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true,
    });
    window.globalTipDispatch = vi.fn();

    const preloadedState = {
      company: buildCompanyStateWith({
        companyInfo: {
          status: CompanyStatus.APPROVED,
        },
      }),
    };

    const b3sStorageGetSpy = vi.spyOn(B3SStorage, 'get').mockImplementation((key: string) => {
      if (key === 'blockPendingAccountOrderCreation') {
        return 'false';
      }

      if (key === 'sf-isShowBlockPendingAccountOrderCreationTip') {
        return { cartTip: 0, checkoutTip: 0 };
      }

      return undefined;
    });

    renderHookWithProviders(
      () => useCartToQuote({ setOpenPage: vi.fn(), cartQuoteEnabled: true }),
      { preloadedState },
    );

    expect(window.globalTipDispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          globalTipMessage: expect.objectContaining({
            msgs: expect.arrayContaining([
              expect.objectContaining({
                msg: 'Your business account has been rejected. Ordering is disabled.',
              }),
            ]),
          }),
        }),
      }),
    );
    b3sStorageGetSpy.mockRestore();
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
    });
  });
});

describe('when the user is on checkout page and the company status is PENDING', () => {
  it('does not show specific rejected or pending error message', () => {
    const mockLocation = {
      href: `http://localhost${CHECKOUT_URL}`,
      pathname: CHECKOUT_URL,
      search: '',
      hash: '',
      assign: vi.fn(),
      replace: vi.fn(),
      reload: vi.fn(),
      ancestorOrigins: {} as DOMStringList,
      host: 'localhost',
      hostname: 'localhost',
      origin: 'http://localhost',
      port: '',
      protocol: 'http:',
    };

    const originalLocation = window.location;

    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true,
    });
    window.globalTipDispatch = vi.fn();

    const preloadedState = {
      company: buildCompanyStateWith({
        companyInfo: {
          status: CompanyStatus.PENDING,
        },
      }),
    };

    const b3sStorageGetSpy = vi.spyOn(B3SStorage, 'get').mockImplementation((key: string) => {
      if (key === 'blockPendingAccountOrderCreation') {
        return 'false';
      }

      if (key === 'sf-isShowBlockPendingAccountOrderCreationTip') {
        return { cartTip: 0, checkoutTip: 0 };
      }

      return undefined;
    });

    renderHookWithProviders(
      () => useCartToQuote({ setOpenPage: vi.fn(), cartQuoteEnabled: true }),
      { preloadedState },
    );

    expect(window.globalTipDispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          globalTipMessage: expect.objectContaining({
            msgs: expect.arrayContaining([
              expect.objectContaining({
                msg: 'Your business account has been rejected. Ordering is disabled.',
              }),
            ]),
          }),
        }),
      }),
    );

    expect(window.globalTipDispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          globalTipMessage: expect.objectContaining({
            msgs: expect.arrayContaining([
              expect.objectContaining({
                msg: 'Your account is pending approval. Ordering will be enabled after account approval.',
              }),
            ]),
          }),
        }),
      }),
    );
    b3sStorageGetSpy.mockRestore();
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
    });
  });
});
