import { Dispatch } from 'react';

import { CustomStyleButtonAction } from '@/shared/customStyleButton/context/config';
import { DispatchProps } from '@/shared/global/context/config';
import { gotoAllowedAppPage } from '@/shared/routes';
import { setChannelStoreType } from '@/shared/service/b2b';
import { AppDispatch, isB2BUserSelector, setGlobalCommonState, store } from '@/store';
import { resolveInitNavigation } from '@/utils/resolveInitNavigation';

import { PATH_ROUTES } from '../constants';

import { b2bJumpPath } from './b3CheckPermissions/b2bPermissionPath';
import b2bVerifyBcLoginStatus from './b2bVerifyBcLoginStatus';
import clearInvoiceCart from './b3ClearCart';
import b2bLogger from './b3Logger';
import { isCompanyError } from './companyUtils';
import { ensureBcGraphqlToken, getCompanyInfo, getCurrentCustomerInfo } from './loginInfo';
import { logoutSession } from './logoutSession';
import { shouldOpenAllowedPageOnInit } from './nativeStorefrontLinks';
import { getGlobalStoreTax, getStoreConfigs, setStorefrontConfig } from './storefrontConfig';
import { getStoreSettings } from './storefrontSettings';

interface InitializeAppParams {
  customerId: number | string;
  role: number | string;
  b2bId?: number;
  isAgenting: boolean;
  pathname: string;
  search: string;
  gotoPage: (url: string) => void;
  showPageMask: (show: boolean) => void;
  dispatch: DispatchProps;
  styleDispatch: Dispatch<Partial<CustomStyleButtonAction>>;
  storeDispatch: AppDispatch;
}

interface InitializeAppResult {
  // false signals the caller should allow a future dep change to retry init
  completed: boolean;
  // customerId actually initialized for; can differ from the param (guest -> logged in)
  resolvedCustomerId?: number | string;
}

export const initializeApp = async ({
  customerId,
  role,
  b2bId,
  isAgenting,
  pathname,
  search,
  gotoPage,
  showPageMask,
  dispatch,
  styleDispatch,
  storeDispatch,
}: InitializeAppParams): Promise<InitializeAppResult> => {
  try {
    // Verify BC session is still valid when we have a rehydrated customerId.
    // Handles forced logouts (e.g., user logged in from another browser causing
    // BC to invalidate this session and redirect to the login page).
    if (customerId) {
      const isBcLogin = await b2bVerifyBcLoginStatus();
      if (!isBcLogin) {
        logoutSession();
        showPageMask(false);
        return { completed: false };
      }
    }

    await ensureBcGraphqlToken();

    setChannelStoreType();

    // load the store config before fetching other data
    // as some fetches depend on the store config or feature flags being present
    await getStoreConfigs(styleDispatch, dispatch);

    const userInfo = {
      role: Number(role),
      isAgenting,
    };
    let companyLoginFlag: string | null = null;

    // Resolve identity before the permission-gated fetches below so they see this
    // login's permissions instead of stale/unset ones.
    let resolvedCustomerId = customerId;
    if (!customerId) {
      const info = await getCurrentCustomerInfo().catch((error) => {
        if (isCompanyError(error)) {
          companyLoginFlag = error.reason;
        }
      });
      if (info) {
        userInfo.role = info?.role;
        // getCurrentCustomerInfo dispatches the resolved id to redux rather than returning it
        resolvedCustomerId = store.getState().company.customer.id;
      }
    }

    await Promise.allSettled([
      getGlobalStoreTax(),
      setStorefrontConfig(dispatch),
      getStoreSettings(),
      getCompanyInfo(role, b2bId),
    ]);

    const resolvedAuthorizedPages = isB2BUserSelector(store.getState())
      ? b2bJumpPath(Number(userInfo.role))
      : PATH_ROUTES.ORDERS;

    // background login enter judgment and refresh
    const nativeLinkInterceptionEnabled =
      store.getState().global.featureFlags['B2B-4912.buyer_portal_native_link_interception'] ??
      false;
    const shouldOpenAllowedPage = nativeLinkInterceptionEnabled
      ? shouldOpenAllowedPageOnInit({
          pathname,
          hash: window.location.hash,
          customerId: resolvedCustomerId,
        })
      : !pathname.includes('checkout') && !(!!resolvedCustomerId && !window.location.hash);
    const isAccountPageWithoutHash = pathname.includes('account.php') && !window.location.hash;

    const initNavigation = resolveInitNavigation({
      companyLoginFlag,
      shouldOpenAllowedPage,
      isAccountPageWithoutHash,
      pathname,
      search,
      role: Number(userInfo.role),
      isAgenting,
      authorizedPages: resolvedAuthorizedPages,
    });

    if (initNavigation.type === 'goto') {
      gotoPage(initNavigation.url);
    } else if (initNavigation.type === 'allowedAppPage') {
      await gotoAllowedAppPage(Number(userInfo.role), gotoPage, isAccountPageWithoutHash);
    } else {
      showPageMask(false);
    }

    if (resolvedCustomerId) {
      clearInvoiceCart();
    }

    storeDispatch(
      setGlobalCommonState({
        isPageComplete: true,
      }),
    );

    return { completed: true, resolvedCustomerId };
  } catch (e) {
    b2bLogger.error(e);
    showPageMask(false);
    storeDispatch(
      setGlobalCommonState({
        isPageComplete: true,
      }),
    );

    return { completed: false };
  }
};
