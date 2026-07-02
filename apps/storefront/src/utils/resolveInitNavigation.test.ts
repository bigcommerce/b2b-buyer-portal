import { CustomerRole } from '@/types';

import { resolveInitNavigation } from './resolveInitNavigation';

const baseInput = {
  companyLoginFlag: null as string | null,
  shouldOpenAllowedPage: true,
  isAccountPageWithoutHash: true,
  pathname: '/account.php',
  search: '?action=order_status',
  role: CustomerRole.B2C,
  isAgenting: false,
  authorizedPages: '/orders',
};

describe('resolveInitNavigation', () => {
  it('navigates to the login flag and ignores the account-page mapping when there is a company error', () => {
    const decision = resolveInitNavigation({
      ...baseInput,
      companyLoginFlag: 'pendingApprovalToOrder',
    });

    expect(decision).toEqual({ type: 'goto', url: '/login?loginFlag=pendingApprovalToOrder' });
  });

  it('navigates to the login flag even when the allowed-page guard is false', () => {
    const decision = resolveInitNavigation({
      ...baseInput,
      companyLoginFlag: 'accountInactive',
      shouldOpenAllowedPage: false,
      isAccountPageWithoutHash: false,
      pathname: '/checkout',
      search: '',
    });

    expect(decision).toEqual({ type: 'goto', url: '/login?loginFlag=accountInactive' });
  });

  it('maps a native account action to the portal route when there is no company error', () => {
    const decision = resolveInitNavigation({
      ...baseInput,
      search: '?action=address_book',
    });

    expect(decision).toEqual({ type: 'goto', url: '/addresses' });
  });

  it('uses authorizedPages as-is for SUPER_ADMIN — caller must recompute it from updated role', () => {
    // openPageByClick returns authorizedPages directly for SUPER_ADMIN. If the
    // caller passes the render-time value ('/orders') instead of the post-login
    // recomputed value ('/dashboard'), the user lands on the wrong page.
    const decision = resolveInitNavigation({
      ...baseInput,
      role: CustomerRole.SUPER_ADMIN,
      authorizedPages: '/dashboard',
    });

    expect(decision).toEqual({ type: 'goto', url: '/dashboard' });
  });

  it('defers to gotoAllowedAppPage when the path is not an account page with search', () => {
    const decision = resolveInitNavigation({
      ...baseInput,
      isAccountPageWithoutHash: false,
      pathname: '/',
      search: '',
    });

    expect(decision).toEqual({ type: 'allowedAppPage' });
  });

  it('shows the page mask when no allowed page should open', () => {
    const decision = resolveInitNavigation({
      ...baseInput,
      shouldOpenAllowedPage: false,
      isAccountPageWithoutHash: false,
      pathname: '/checkout',
      search: '',
    });

    expect(decision).toEqual({ type: 'mask' });
  });
});
