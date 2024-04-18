import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import persistReducer from 'redux-persist/es/persistReducer'
import storage from 'redux-persist/lib/storage'

import {
  CompanyInfo,
  CompanyStatus,
  Customer,
  CustomerRole,
  UserTypes,
} from '@/types'

interface Tokens {
  B2BToken: string
  bcGraphqlToken: string
  currentCustomerJWT: string
}
export interface CompanyState {
  companyInfo: CompanyInfo
  customer: Customer
  tokens: Tokens
}

const initialState: CompanyState = {
  companyInfo: {
    id: '',
    companyName: '',
    status: CompanyStatus.DEFAULT,
  },
  customer: {
    id: 1,
    phoneNumber: '',
    firstName: '',
    lastName: '',
    emailAddress: '',
    customerGroupId: 1,
    role: CustomerRole.GUEST,
    userType: UserTypes.DOESNT_EXIST,
  },
  tokens: {
    B2BToken: '',
    bcGraphqlToken: '',
    currentCustomerJWT: '',
  },
}

const companySlice = createSlice({
  name: 'company',
  initialState,
  reducers: {
    clearCompanySlice: () => initialState,
    clearCompanyInfo: (state) => {
      state.companyInfo = initialState.companyInfo
    },
    clearCustomer: (state) => {
      state.customer = initialState.customer
    },
    setCompanyInfo: (state, { payload }: PayloadAction<CompanyInfo>) => {
      state.companyInfo = payload
    },
    setCustomerInfo: (state, { payload }: PayloadAction<Customer>) => {
      state.customer = payload
    },
    setCompanyStatus: (state, { payload }: PayloadAction<CompanyStatus>) => {
      state.companyInfo.status = payload
    },
    setTokens: (state, { payload }: PayloadAction<Tokens>) => {
      state.tokens = payload
    },
    setB2BToken: (state, { payload }: PayloadAction<string>) => {
      state.tokens.B2BToken = payload
    },
    setbcGraphqlToken: (state, { payload }: PayloadAction<string>) => {
      state.tokens.bcGraphqlToken = payload
    },
    setCurrentCustomerJWT: (state, { payload }: PayloadAction<string>) => {
      state.tokens.currentCustomerJWT = payload
    },
  },
})

export const {
  clearCompanySlice,
  setCompanyInfo,
  clearCompanyInfo,
  setCompanyStatus,
  setCustomerInfo,
  clearCustomer,
  setTokens,
  setB2BToken,
  setbcGraphqlToken,
  setCurrentCustomerJWT,
} = companySlice.actions

export default persistReducer({ key: 'company', storage }, companySlice.reducer)
