import { PersistPartial } from 'redux-persist/es/persistReducer';

import { CompanyState } from '@/store/slices/company';
import { CompanyStatus, CustomerRole, LoginTypes, UserTypes } from '@/types';
import { builder } from 'tests/builder';

// TODO: we should use faker to generate random data once faker is in place
export const buildCompanyStateWith = builder<CompanyState & PersistPartial>(() => ({
  companyInfo: {
    id: '',
    companyName: '',
    status: CompanyStatus.DEFAULT,
  },
  customer: {
    id: 0,
    phoneNumber: '',
    firstName: '',
    lastName: '',
    emailAddress: '',
    customerGroupId: 0,
    role: CustomerRole.GUEST,
    userType: UserTypes.DOES_NOT_EXIST,
    loginType: LoginTypes.WAITING_LOGIN,
    companyRoleName: '',
  },
  tokens: {
    B2BToken: '',
    bcGraphqlToken: '',
    currentCustomerJWT: '',
  },
  permissions: [],
  companyHierarchyInfo: {
    isEnabledCompanyHierarchy: true,
    isHasCurrentPagePermission: true,
    selectCompanyHierarchyId: '',
    companyHierarchyList: [],
    companyHierarchyAllList: [],
    companyHierarchySelectSubsidiariesList: [],
  },
  pagesSubsidiariesPermission: {
    order: false,
    invoice: false,
    addresses: false,
    userManagement: false,
    shoppingLists: false,
    quotes: false,
    companyHierarchy: false,
    quickOrder: false,
  },
  _persist: {
    version: 1,
    rehydrated: true,
  },
}));
