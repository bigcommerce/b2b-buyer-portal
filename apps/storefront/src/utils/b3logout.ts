import { store } from '@/store';
import { clearCompanySlice } from '@/store/slices/company';

import b2bVerifyBcLoginStatus from './b2bVerifyBcLoginStatus';
import b2bLogger from './b3Logger';

export const logoutSession = () => {
  store.dispatch(clearCompanySlice());
};

export const isB2bTokenPage = (gotoUrl?: string) => {
  const noB2bTokenPages = ['quoteDraft', 'quoteDetail', 'register', 'login', 'forgotpassword'];

  if (gotoUrl) {
    return !noB2bTokenPages.some((item: string) => gotoUrl.includes(item));
  }

  const { hash = '' } = window.location;

  if (!hash.includes('#/')) {
    return false;
  }

  return !noB2bTokenPages.some((item: string) => hash.includes(item));
};

export const isUserGotoLogin = async (gotoUrl: string) => {
  const isB2bPage = isB2bTokenPage(gotoUrl);
  let isGotoLogin = false;

  try {
    const isBcLogin = await b2bVerifyBcLoginStatus();

    if (!isBcLogin && isB2bPage) {
      logoutSession();
      isGotoLogin = true;
    }
  } catch (error: unknown) {
    b2bLogger.error(error);
  }

  return isGotoLogin;
};
