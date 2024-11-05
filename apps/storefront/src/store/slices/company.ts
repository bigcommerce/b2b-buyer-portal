/* eslint-disable @typescript-eslint/naming-convention */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import persistReducer from 'redux-persist/es/persistReducer';
import storageSession from 'redux-persist/lib/storage/session';

import {
  CompanyHierarchyInfoProps,
  CompanyHierarchyListProps,
  CompanyInfo,
  CompanyStatus,
  Customer,
  CustomerRole,
  LoginTypes,
  UserTypes,
} from '@/types';

interface Tokens {
  B2BToken: string;
  bcGraphqlToken: string;
  currentCustomerJWT: string;
}

interface PermissionsCodesProps {
  code: string;
  permissionLevel: number;
}

export interface CompanyState {
  companyInfo: CompanyInfo;
  customer: Customer;
  tokens: Tokens;
  permissions: PermissionsCodesProps[];
  companyHierarchyInfo: CompanyHierarchyInfoProps;
}

const initialState: CompanyState = {
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
    /** the customerGroupId for the guest user is 0 */
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
    selectCompanyHierarchyId: '',
    companyHierarchyList: [],
  },
};

const companySlice = createSlice({
  name: 'company',
  initialState,
  reducers: {
    clearCompanySlice: () => initialState,
    clearCompanyInfo: (state) => {
      state.companyInfo = initialState.companyInfo;
    },
    clearCustomer: (state) => {
      state.customer = initialState.customer;
    },
    setCompanyInfo: (state, { payload }: PayloadAction<CompanyInfo>) => {
      state.companyInfo = payload;
    },
    setCustomerInfo: (state, { payload }: PayloadAction<Customer>) => {
      state.customer = payload;
    },
    setCompanyStatus: (state, { payload }: PayloadAction<CompanyStatus>) => {
      state.companyInfo.status = payload;
    },
    setTokens: (state, { payload }: PayloadAction<Tokens>) => {
      state.tokens = payload;
    },
    setB2BToken: (state, { payload }: PayloadAction<string>) => {
      state.tokens.B2BToken = payload;
    },
    setBcGraphQLToken: (state, { payload }: PayloadAction<string>) => {
      state.tokens.bcGraphqlToken = payload;
    },
    setCurrentCustomerJWT: (state, { payload }: PayloadAction<string>) => {
      state.tokens.currentCustomerJWT = payload;
    },
    setLoginType: (state, { payload }: PayloadAction<LoginTypes>) => {
      state.customer.loginType = payload;
    },
    setPermissionModules: (state, { payload }: PayloadAction<PermissionsCodesProps[]>) => {
      state.permissions = payload;
    },
    setCompanyHierarchyListModules: (
      state,
      { payload }: PayloadAction<CompanyHierarchyListProps[]>,
    ) => {
      state.companyHierarchyInfo = {
        ...state.companyHierarchyInfo,
        companyHierarchyList: payload,
      };
    },
    setCompanyHierarchyInfoModules: (
      state,
      { payload }: PayloadAction<CompanyHierarchyInfoProps>,
    ) => {
      state.companyHierarchyInfo = payload;
    },
  },
});

export const {
  clearCompanySlice,
  setCompanyInfo,
  clearCompanyInfo,
  setCompanyStatus,
  setCustomerInfo,
  clearCustomer,
  setTokens,
  setB2BToken,
  setBcGraphQLToken,
  setCurrentCustomerJWT,
  setLoginType,
  setPermissionModules,
  setCompanyHierarchyListModules,
  setCompanyHierarchyInfoModules,
} = companySlice.actions;

export default persistReducer({ key: 'company', storage: storageSession }, companySlice.reducer);
