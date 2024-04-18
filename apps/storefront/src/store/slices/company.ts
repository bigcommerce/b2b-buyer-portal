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

export interface CompanyState {
  companyInfo: CompanyInfo
  customer: Customer
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
  },
})

export const {
  clearCompanySlice,
  setCompanyInfo,
  clearCompanyInfo,
  setCompanyStatus,
  setCustomerInfo,
  clearCustomer,
} = companySlice.actions

export default persistReducer({ key: 'company', storage }, companySlice.reducer)
