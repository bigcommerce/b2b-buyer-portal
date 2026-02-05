import { store } from '@/store';
import { clearCompanySlice } from '@/store/slices/company';
import { resetDraftQuoteInfo, resetDraftQuoteList } from '@/store/slices/quoteInfo';

import b2bVerifyBcLoginStatus from './b2bVerifyBcLoginStatus';
import b2bLogger from './b3Logger';

export const logoutSession = () => {
  store.dispatch(clearCompanySlice());
  store.dispatch(resetDraftQuoteList());
  store.dispatch(resetDraftQuoteInfo());
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
  if (!isB2bTokenPage(gotoUrl)) {
    return false;
  }

  try {
    const isBcLogin = await b2bVerifyBcLoginStatus();

    if (!isBcLogin) {
      logoutSession();
      return true;
    }
  } catch (error: unknown) {
    b2bLogger.error(error);
  }

  return false;
};
