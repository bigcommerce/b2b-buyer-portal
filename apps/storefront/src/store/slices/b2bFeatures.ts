import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'

export interface Masquerade {
  id: number
  isAgenting: boolean
  companyName: string
  companyStatus: string
}

export interface MasqueradeCompany {
  masqueradeCompany: Masquerade
}

const initialState: MasqueradeCompany = {
  masqueradeCompany: {
    id: 0,
    isAgenting: false,
    companyName: '',
    companyStatus: '',
  },
}

export const b2bFeaturesSlice = createSlice({
  name: 'b2bFeatures',
  initialState,
  reducers: {
    clearMasqueradeCompany: () => initialState,
    setIsAgenting: (state, { payload }: PayloadAction<MasqueradeCompany>) => {
      state.masqueradeCompany.isAgenting = payload.masqueradeCompany.isAgenting
    },
    setMasqueradeCompany: (
      state,
      { payload }: PayloadAction<MasqueradeCompany>
    ) => {
      state.masqueradeCompany = payload.masqueradeCompany
    },
    setIsMasqueradeCompanyId: (
      state,
      { payload }: PayloadAction<MasqueradeCompany>
    ) => {
      state.masqueradeCompany.id = payload.masqueradeCompany.id
    },
    setIsMasqueradeCompanyName: (
      state,
      { payload }: PayloadAction<MasqueradeCompany>
    ) => {
      state.masqueradeCompany.companyName =
        payload.masqueradeCompany.companyName
    },
    setIsMasqueradeCompanyStatus: (
      state,
      { payload }: PayloadAction<MasqueradeCompany>
    ) => {
      state.masqueradeCompany.companyStatus =
        payload.masqueradeCompany.companyStatus
    },
  },
})

export const {
  clearMasqueradeCompany,
  setIsAgenting,
  setMasqueradeCompany,
  setIsMasqueradeCompanyId,
  setIsMasqueradeCompanyName,
  setIsMasqueradeCompanyStatus,
} = b2bFeaturesSlice.actions

export default persistReducer(
  { key: 'b2bFeatures', storage },
  b2bFeaturesSlice.reducer
)
