import { PersistPartial } from 'redux-persist/es/persistReducer';
import { builder } from 'tests/builder';
import { faker } from 'tests/test-utils';

import { CompanyState } from '@/store/slices/company';
import { CompanyStatus, Customer, CustomerRole, LoginTypes, UserTypes } from '@/types';

export const buildCustomerWith = builder<Customer>(() => ({
  id: faker.number.int(),
  phoneNumber: faker.phone.number(),
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  emailAddress: faker.internet.email(),
  customerGroupId: faker.number.int(),
  role: faker.helpers.arrayElement([
    CustomerRole.SUPER_ADMIN,
    CustomerRole.ADMIN,
    CustomerRole.B2C,
    CustomerRole.JUNIOR_BUYER,
  ]),
  userType: faker.helpers.arrayElement([
    UserTypes.B2B_SUPER_ADMIN,
    UserTypes.B2C,
    UserTypes.CURRENT_B2B_COMPANY,
  ]),
  loginType: faker.helpers.arrayElement([
    LoginTypes.FIRST_LOGIN,
    LoginTypes.GENERAL_LOGIN,
    LoginTypes.WAITING_LOGIN,
  ]),
  companyRoleName: faker.lorem.word(),
}));

// TODO: we should use faker to generate random data once faker is in place
export const buildCompanyStateWith = builder<CompanyState & PersistPartial>(() => ({
  companyInfo: {
    id: '',
    companyName: '',
    status: CompanyStatus.DEFAULT,
  },
  // TODO: need to replace it with buildCustomerWith
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
  },
  _persist: {
    version: 1,
    rehydrated: true,
  },
}));
