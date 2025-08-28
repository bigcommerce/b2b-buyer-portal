import { getCurrentCustomerJWT } from '@/shared/service/bc';
import { getAppClientId } from '@/shared/service/request/base';
import { store } from '@/store';
import { CustomerRole } from '@/types';
import b2bLogger from '@/utils/b3Logger';

import { platform } from './basicConfig';

const b2bVerifyBcLoginStatus = async () => {
  let isBcLogin = false;
  const { role } = store.getState().company.customer;
  const { B2BToken } = store.getState().company.tokens;

  if (B2BToken && platform !== 'bigcommerce') return true;

  try {
    if (Number(role) !== CustomerRole.GUEST) {
      const bcToken = await getCurrentCustomerJWT(getAppClientId());

      isBcLogin = !!bcToken;

      return isBcLogin;
    }
  } catch (err: unknown) {
    b2bLogger.error(err);
  }

  return isBcLogin;
};

export default b2bVerifyBcLoginStatus;
