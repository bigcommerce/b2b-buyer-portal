/*
 * Verbatim port of App.tsx's pre-B2B-5366 inline init effect, kept only as the
 * flag-off fallback for B2B-5366.prevent_premature_orders_redirect. Delete this
 * file, its import in App.tsx, and the flag once the new initializeApp() path
 * (initializeApp.ts) is confirmed safe in production.
 */
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

interface LegacyInitializeAppParams {
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

export const legacyInitializeApp = async ({
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
}: LegacyInitializeAppParams): Promise<void> => {
  try {
    if (customerId) {
      const isBcLogin = await b2bVerifyBcLoginStatus();
      if (!isBcLogin) {
        logoutSession();
        showPageMask(false);
        return;
      }
    }

    await ensureBcGraphqlToken();

    setChannelStoreType();

    await getStoreConfigs(styleDispatch, dispatch);

    await Promise.allSettled([
      getGlobalStoreTax(),
      setStorefrontConfig(dispatch),
      getStoreSettings(),
      getCompanyInfo(role, b2bId),
    ]);

    const userInfo = {
      role: Number(role),
      isAgenting,
    };
    let companyLoginFlag: string | null = null;
    if (!customerId) {
      const info = await getCurrentCustomerInfo().catch((error) => {
        if (isCompanyError(error)) {
          companyLoginFlag = error.reason;
        }
      });
      if (info) {
        userInfo.role = info?.role;
      }
    }

    const resolvedAuthorizedPages = isB2BUserSelector(store.getState())
      ? b2bJumpPath(Number(userInfo.role))
      : PATH_ROUTES.ORDERS;

    const nativeLinkInterceptionEnabled =
      store.getState().global.featureFlags['B2B-4912.buyer_portal_native_link_interception'] ??
      false;
    const shouldOpenAllowedPage = nativeLinkInterceptionEnabled
      ? shouldOpenAllowedPageOnInit({ pathname, hash: window.location.hash, customerId })
      : !pathname.includes('checkout') && !(!!customerId && !window.location.hash);
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

    if (customerId) {
      clearInvoiceCart();
    }

    storeDispatch(
      setGlobalCommonState({
        isPageComplete: true,
      }),
    );
  } catch (e) {
    b2bLogger.error(e);
    showPageMask(false);
    storeDispatch(
      setGlobalCommonState({
        isPageComplete: true,
      }),
    );
  }
};
