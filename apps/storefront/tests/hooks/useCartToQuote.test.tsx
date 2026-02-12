import { buildCompanyStateWith } from 'tests/test-utils';
import { renderHookWithProviders } from 'tests/utils/hook-test-utils';
import { vi } from 'vitest';

import { CART_URL, CHECKOUT_URL } from '@/constants';
import { CompanyStatus, CustomerRole, UserTypes } from '@/types';
import { B3SStorage } from '@/utils/b3Storage';

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

describe('when B2B user without purchasability permission is on the checkout page', () => {
  it('redirects to home and shows error message', () => {
    const hrefSpy = vi.fn();
    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      value: {
        get href() {
          return `http://localhost${CHECKOUT_URL}`;
        },
        set href(newUrl: string) {
          hrefSpy(newUrl);
        },
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
      },
      writable: true,
      configurable: true,
    });
    window.globalTipDispatch = vi.fn();

    const preloadedState = {
      company: buildCompanyStateWith({
        customer: {
          role: CustomerRole.SUPER_ADMIN,
          userType: UserTypes.MULTIPLE_B2C,
        },
        companyInfo: {
          status: CompanyStatus.APPROVED,
        },
        permissions: [],
      }),
    };

    renderHookWithProviders(
      () => useCartToQuote({ setOpenPage: vi.fn(), cartQuoteEnabled: true }),
      { preloadedState },
    );

    expect(hrefSpy).toHaveBeenCalledWith('/');
    expect(window.globalTipDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'globalTip',
        payload: expect.objectContaining({
          globalTipMessage: expect.objectContaining({
            msgs: expect.arrayContaining([
              expect.objectContaining({
                msg: 'User does not have permission to place an order.',
              }),
            ]),
          }),
        }),
      }),
    );

    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
  });
});

describe('when B2B user without purchasability permission is on the cart page', () => {
  it('does not redirect', () => {
    const hrefSpy = vi.fn();
    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      value: {
        get href() {
          return `http://localhost${CART_URL}`;
        },
        set href(newUrl: string) {
          hrefSpy(newUrl);
        },
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
      },
      writable: true,
      configurable: true,
    });
    window.globalTipDispatch = vi.fn();

    const preloadedState = {
      company: buildCompanyStateWith({
        customer: {
          role: CustomerRole.SUPER_ADMIN,
          userType: UserTypes.MULTIPLE_B2C,
        },
        companyInfo: {
          status: CompanyStatus.APPROVED,
        },
        permissions: [],
      }),
    };

    renderHookWithProviders(
      () => useCartToQuote({ setOpenPage: vi.fn(), cartQuoteEnabled: true }),
      { preloadedState },
    );

    expect(hrefSpy).not.toHaveBeenCalled();

    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
  });
});

describe('when B2B user with purchasability permission is on the checkout page', () => {
  it('does not redirect', () => {
    const hrefSpy = vi.fn();
    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      value: {
        get href() {
          return `http://localhost${CHECKOUT_URL}`;
        },
        set href(newUrl: string) {
          hrefSpy(newUrl);
        },
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
      },
      writable: true,
      configurable: true,
    });
    window.globalTipDispatch = vi.fn();

    const preloadedState = {
      company: buildCompanyStateWith({
        customer: {
          role: CustomerRole.SUPER_ADMIN,
          userType: UserTypes.MULTIPLE_B2C,
        },
        companyInfo: {
          status: CompanyStatus.APPROVED,
        },
        permissions: [{ code: 'purchase_enable', permissionLevel: 1 }],
      }),
    };

    renderHookWithProviders(
      () => useCartToQuote({ setOpenPage: vi.fn(), cartQuoteEnabled: true }),
      { preloadedState },
    );

    expect(hrefSpy).not.toHaveBeenCalled();

    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
  });
});

describe('when non-B2B user without purchasability permission is on the checkout page', () => {
  it('does not redirect', () => {
    const hrefSpy = vi.fn();
    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      value: {
        get href() {
          return `http://localhost${CHECKOUT_URL}`;
        },
        set href(newUrl: string) {
          hrefSpy(newUrl);
        },
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
      },
      writable: true,
      configurable: true,
    });
    window.globalTipDispatch = vi.fn();

    const preloadedState = {
      company: buildCompanyStateWith({
        customer: {
          role: CustomerRole.GUEST,
          userType: UserTypes.DOES_NOT_EXIST,
        },
        permissions: [],
      }),
    };

    renderHookWithProviders(
      () => useCartToQuote({ setOpenPage: vi.fn(), cartQuoteEnabled: true }),
      { preloadedState },
    );

    expect(hrefSpy).not.toHaveBeenCalled();

    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
  });
});
