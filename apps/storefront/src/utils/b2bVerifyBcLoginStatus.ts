import { getCurrentCustomerJWT } from '@/shared/service/bc';
import { B2B_APP_CLIENT_ID } from '@/shared/service/request/base';
import { store } from '@/store';
import { CustomerRole } from '@/types';
import b2bLogger from '@/utils/b3Logger';

const b2bVerifyBcLoginStatus = async () => {
  let isBcLogin = false;
  const { role } = store.getState().company.customer;

  try {
    if (+role !== CustomerRole.GUEST) {
      const bcToken = await getCurrentCustomerJWT(B2B_APP_CLIENT_ID);
      isBcLogin = !!bcToken;

      return isBcLogin;
    }
  } catch (err: unknown) {
    b2bLogger.error(err);
  }

  return isBcLogin;
};

export default b2bVerifyBcLoginStatus;
