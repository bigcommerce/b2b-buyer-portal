import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'

export interface MasqueradeCompany {
  isAgenting: boolean
}

const initialState: MasqueradeCompany = {
  isAgenting: false,
}

export const b2bFeaturesSlice = createSlice({
  name: 'b2bFeatures',
  initialState,
  reducers: {
    setIsAgenting: (state, { payload }: PayloadAction<MasqueradeCompany>) => {
      state.isAgenting = payload.isAgenting
    },
  },
})

export const { setIsAgenting } = b2bFeaturesSlice.actions

export default persistReducer(
  { key: 'b2bFeatures', storage },
  b2bFeaturesSlice.reducer
)
