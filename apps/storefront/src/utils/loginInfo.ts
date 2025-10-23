import {
  getAgentInfo,
  getB2BCompanyUserInfo,
  getB2BToken,
  getBCGraphqlToken,
  getUserCompany,
} from '@/shared/service/b2b';
import { getCurrentCustomerJWT, getCustomerInfo } from '@/shared/service/bc';
import { getAppClientId } from '@/shared/service/request/base';
import {
  clearMasqueradeCompany,
  MasqueradeCompany,
  setMasqueradeCompany,
  setQuoteUserId,
  store,
} from '@/store';
import {
  clearCompanySlice,
  setB2BToken,
  setBcGraphQLToken,
  setCompanyInfo,
  setCompanyStatus,
  setCurrentCustomerJWT,
  setCustomerInfo,
  setLoginType,
  setPermissionModules,
} from '@/store/slices/company';
import { resetDraftQuoteInfo, resetDraftQuoteList } from '@/store/slices/quoteInfo';
import { CompanyStatus, CustomerRole, CustomerRoleName, LoginTypes, UserTypes } from '@/types';

import b2bLogger from './b3Logger';
import { B3LStorage, B3SStorage } from './b3Storage';
import { channelId, storeHash } from './basicConfig';

const getLoginTokenInfo = () => {
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const oneWeekInSeconds = 7 * 24 * 60 * 60;
  const expiresTimestamp = currentTimestamp + oneWeekInSeconds;
  const { origin } = window.location;
  const data = {
    storeHash,
    channel_id: channelId,
    expires_at: expiresTimestamp,
    allowed_cors_origins: [origin],
  };

  return data;
};

export const loginInfo = async () => {
  const loginTokenInfo = getLoginTokenInfo();

  const token = await getBCGraphqlToken(loginTokenInfo);
  if (token) {
    store.dispatch(setBcGraphQLToken(token));
  }
};

const clearCurrentCustomerInfo = async () => {
  store.dispatch(setB2BToken(''));

  B3SStorage.set('isShowBlockPendingAccountOrderCreationTip', {
    cartTip: 0,
    checkoutTip: 0,
  });
  B3SStorage.set('blockPendingAccountOrderCreation', false);
  B3SStorage.set('loginCustomer', '');
  sessionStorage.removeItem('b2b-blockPendingAccountOrderCreation');
  store.dispatch(clearCompanySlice());
  store.dispatch(clearMasqueradeCompany());
};

// companyStatus
// 99: default, Distinguish between bc and b2b
// 0: pending
// 1: approved
// 2: rejected
// 3: inactive
// 4: deleted

const VALID_ROLES = [
  CustomerRole.ADMIN,
  CustomerRole.SENIOR_BUYER,
  CustomerRole.JUNIOR_BUYER,
  CustomerRole.CUSTOM_ROLE,
];

export const getCompanyInfo = async (
  role: number | string,
  id?: number,
  userType = UserTypes.MULTIPLE_B2C,
) => {
  let companyInfo = {
    id: '',
    companyName: '',
    companyStatus: CompanyStatus.DEFAULT,
  };

  const { B2BToken } = store.getState().company.tokens;
  if (!B2BToken || !VALID_ROLES.includes(Number(role))) return companyInfo;

  if (id && userType === UserTypes.MULTIPLE_B2C && Number(role) !== CustomerRole.SUPER_ADMIN) {
    const { userCompany } = await getUserCompany(id);

    if (userCompany) {
      companyInfo = {
        ...userCompany,
      };
    }
  }

  store.dispatch(setCompanyStatus(companyInfo.companyStatus));

  if (companyInfo.companyStatus === CompanyStatus.REJECTED) {
    sessionStorage.setItem('b2b-blockRejectedAccountOrderCreation', JSON.stringify(true));
  } else {
    sessionStorage.removeItem('b2b-blockRejectedAccountOrderCreation');
  }

  const blockPendingAccountOrderCreation = B3SStorage.get('blockPendingAccountOrderCreation');
  const noNewSFPlaceOrders =
    blockPendingAccountOrderCreation && companyInfo.companyStatus === CompanyStatus.PENDING;
  if (noNewSFPlaceOrders) {
    sessionStorage.setItem(
      'b2b-blockPendingAccountOrderCreation',
      JSON.stringify(noNewSFPlaceOrders),
    );
  } else {
    sessionStorage.removeItem('b2b-blockPendingAccountOrderCreation');
  }

  return companyInfo;
};

const agentInfo = async (customerId: number | string, role: number) => {
  if (Number(role) === CustomerRole.SUPER_ADMIN) {
    try {
      const data: any = await getAgentInfo(customerId);
      if (data?.superAdminMasquerading) {
        const { id, companyName, customerGroupId = 0 } = data.superAdminMasquerading;

        const masqueradeCompany: MasqueradeCompany = {
          masqueradeCompany: {
            id: Number(id),
            isAgenting: true,
            companyName,
            customerGroupId,
          },
        };

        store.dispatch(setMasqueradeCompany(masqueradeCompany));
      }
    } catch (error) {
      b2bLogger.error(error);
    }
  }
};

const getCompanyUserInfo = async () => {
  try {
    const {
      customerInfo: {
        userType,
        userInfo: { role = '', id, companyRoleName = '' },
        permissions,
      },
    } = await getB2BCompanyUserInfo();

    return {
      userType,
      role,
      id,
      companyRoleName,
      permissions,
    };
  } catch (error) {
    b2bLogger.error(error);
  }
  return undefined;
};

const loginWithCurrentCustomerJWT = async () => {
  const prevCurrentCustomerJWT = store.getState().company.tokens.currentCustomerJWT;
  let currentCustomerJWT;
  try {
    currentCustomerJWT = await getCurrentCustomerJWT(getAppClientId());
  } catch (error) {
    b2bLogger.error(error);
    return undefined;
  }

  if (!currentCustomerJWT || prevCurrentCustomerJWT === currentCustomerJWT) return undefined;

  const data = await getB2BToken(currentCustomerJWT, channelId);
  const B2BToken = data.authorization.result.token as string;
  const newLoginType = data.authorization.result.loginType as LoginTypes;

  const B2BPermissions = data.authorization.result.permissions;
  store.dispatch(setPermissionModules(B2BPermissions));

  store.dispatch(setCurrentCustomerJWT(currentCustomerJWT));
  store.dispatch(setLoginType(newLoginType));
  store.dispatch(setB2BToken(B2BToken));

  store.dispatch(clearMasqueradeCompany());

  return { B2BToken, newLoginType };
};

interface CustomerInfo {
  role: number;
  userType: number;
  companyRoleName: string;
}

export const getCurrentCustomerInfo = async (
  b2bToken?: string,
): Promise<CustomerInfo | undefined> => {
  const { B2BToken } = store.getState().company.tokens;

  let loginType = LoginTypes.GENERAL_LOGIN;

  if (!b2bToken && !B2BToken) {
    const data = await loginWithCurrentCustomerJWT();
    if (!data) return undefined;
    loginType = data.newLoginType;
  }

  try {
    const data = await getCustomerInfo();

    if (data?.detail) return undefined;

    const loginCustomer = data.data.customer;

    const {
      entityId: customerId = '',
      phone: phoneNumber,
      firstName,
      lastName,
      email: emailAddress = '',
      customerGroupId,
    } = loginCustomer;

    const companyUserInfo = await getCompanyUserInfo();

    if (companyUserInfo && customerId) {
      const { userType, id, companyRoleName, permissions } = companyUserInfo;

      let { role } = companyUserInfo;

      role =
        role === CustomerRole.JUNIOR_BUYER && companyRoleName !== CustomerRoleName.JUNIOR_BUYER_NAME
          ? CustomerRole.CUSTOM_ROLE
          : role;

      const [companyInfo] = await Promise.all([
        getCompanyInfo(role, id, userType),
        agentInfo(customerId, role),
      ]);

      const isB2BUser =
        (userType === UserTypes.MULTIPLE_B2C &&
          companyInfo?.companyStatus === CompanyStatus.APPROVED) ||
        Number(role) === CustomerRole.SUPER_ADMIN;

      const customerInfo = {
        id: customerId,
        userType,
        phoneNumber,
        firstName,
        lastName,
        emailAddress,
        customerGroupId,
        role: isB2BUser ? role : CustomerRole.B2C,
        b2bId: id,
        loginType,
        companyRoleName,
      };
      const quoteUserId = id || customerId || 0;
      const companyPayload = {
        id: companyInfo.id,
        status: companyInfo.companyStatus,
        companyName: companyInfo.companyName,
      };

      store.dispatch(resetDraftQuoteList());
      store.dispatch(resetDraftQuoteInfo());
      store.dispatch(setPermissionModules(permissions));
      store.dispatch(setCompanyInfo(companyPayload));
      store.dispatch(setCustomerInfo(customerInfo));
      store.dispatch(setQuoteUserId(quoteUserId));
      B3SStorage.set('isB2BUser', isB2BUser);
      B3LStorage.set('cartToQuoteId', '');

      return {
        role,
        userType,
        companyRoleName,
      };
    }
  } catch (error) {
    b2bLogger.error(error);
    clearCurrentCustomerInfo();
  }
  return undefined;
};

export const getSearchVal = (search: string, key: string) => {
  if (!search) {
    return '';
  }
  const searchParams = new URLSearchParams(search);

  return searchParams.get(key);
};
