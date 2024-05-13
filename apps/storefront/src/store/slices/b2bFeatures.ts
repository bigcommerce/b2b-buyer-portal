import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

export interface Masquerade {
  id: number;
  isAgenting: boolean;
  companyName: string;
  customerGroupId: number;
}

export interface MasqueradeCompany {
  masqueradeCompany: Masquerade;
}

const initialState: MasqueradeCompany = {
  masqueradeCompany: {
    id: 0,
    isAgenting: false,
    companyName: '',
    customerGroupId: 0,
  },
};

export const b2bFeaturesSlice = createSlice({
  name: 'b2bFeatures',
  initialState,
  reducers: {
    clearMasqueradeCompany: () => initialState,
    setIsAgenting: (state, { payload }: PayloadAction<MasqueradeCompany>) => {
      state.masqueradeCompany.isAgenting = payload.masqueradeCompany.isAgenting;
    },
    setMasqueradeCompany: (state, { payload }: PayloadAction<MasqueradeCompany>) => {
      state.masqueradeCompany = payload.masqueradeCompany;
    },
  },
});

export const { clearMasqueradeCompany, setIsAgenting, setMasqueradeCompany } =
  b2bFeaturesSlice.actions;

export default persistReducer({ key: 'b2bFeatures', storage }, b2bFeaturesSlice.reducer);
