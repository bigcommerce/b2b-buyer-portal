import { customerExists } from '@/shared/service/bc';
import { store } from '@/store';
import { clearCompanySlice } from '@/store/slices/company';

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
    const {
      data: { customer },
    } = await customerExists();

    if (!customer && isB2bPage) {
      logoutSession();
      isGotoLogin = true;
    }
  } catch (err: unknown) {
    b2bLogger.error(err);
  }

  return isGotoLogin;
};

export default {};
