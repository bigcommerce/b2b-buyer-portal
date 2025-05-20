import { store } from '@/store';
import { clearCompanySlice } from '@/store/slices/company';

import b2bVerifyBcLoginStatus from './b2bVerifyBcLoginStatus';
import b2bLogger from './b3Logger';
import { B3SStorage } from './b3Storage';

export const logoutSession = () => {
  store.dispatch(clearCompanySlice());
  // B2B-2958 clear "all possible" storage keys
  B3SStorage.delete('salesRepCompanyId')
  B3SStorage.delete('isAgenting');
  B3SStorage.delete('isB2BUser');
  B3SStorage.delete('isShowBlockPendingAccountOrderCreationTip');
  B3SStorage.delete('blockPendingAccountOrderCreation');
  B3SStorage.delete('blockPendingAccountViewPrice');
  B3SStorage.delete('cartToQuoteId');
  B3SStorage.delete('prevPath');
  B3SStorage.delete('loginCustomer');
  B3SStorage.delete('showInclusiveTaxPrice');
  B3SStorage.delete('bcLanguage');
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

export default {};
