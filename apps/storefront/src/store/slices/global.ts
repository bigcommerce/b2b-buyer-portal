import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import { Dispatch, SetStateAction } from 'react';

import { OpenPageState } from '@/types/hooks';

export interface TaxZoneRates {
  rate?: number;
  taxClassId?: number;
}

interface Rates {
  enabled: boolean;
  id: number;
  name: string;
  priority: number;
  classRates: TaxZoneRates[];
}

export interface TaxZoneRatesProps {
  enabled: boolean;
  id: number;
  name: string;
  rates: Rates[];
}

export interface StoreInfoProps {
  b2bEnabled: boolean;
  b3ChannelId: number;
  channelId: number;
  channelLogo: string;
  iconUrl: string;
  isEnabled: boolean;
  platform: string;
  translationVersion: number;
  type: string;
  urls: string[];
}

interface GlobalMessageDialog {
  open: boolean;
  title: string;
  message: string;
  cancelText?: string;
  cancelFn?: () => void;
  saveText?: string;
  saveFn?: () => void;
}

interface GlobalBlockPendingQuoteNonPurchasableOOS {
  isEnableProduct?: boolean;
  isEnableRequest?: boolean;
}

export interface GlabolState {
  taxZoneRates: TaxZoneRatesProps[];
  isClickEnterBtn: boolean;
  currentClickedUrl: string;
  isRegisterAndLogin: boolean;
  isPageComplete: boolean;
  globalMessage: GlobalMessageDialog;
  setOpenPageFn?: Dispatch<SetStateAction<OpenPageState>>;
  showInclusiveTaxPrice: boolean;
  blockPendingAccountViewPrice: boolean;
  cartNumber: number;
  storeInfo: StoreInfoProps;
  loginLandingLocation: string;
  recordOpenHash: string;
  blockPendingQuoteNonPurchasableOOS: GlobalBlockPendingQuoteNonPurchasableOOS;
}

const initialState: GlabolState = {
  taxZoneRates: [],
  isClickEnterBtn: false,
  currentClickedUrl: '',
  isRegisterAndLogin: false,
  isPageComplete: false,
  globalMessage: {
    open: false,
    title: '',
    message: '',
    cancelText: 'Cancel',
  },
  setOpenPageFn: undefined,
  showInclusiveTaxPrice: false,
  blockPendingAccountViewPrice: false,
  cartNumber: 0,
  storeInfo: {
    b2bEnabled: false,
    b3ChannelId: 0,
    channelId: 1,
    channelLogo: '',
    iconUrl: '',
    isEnabled: false,
    platform: '',
    translationVersion: 0,
    type: '',
    urls: [],
  },
  blockPendingQuoteNonPurchasableOOS: {
    isEnableProduct: false,
    isEnableRequest: false,
  },
  loginLandingLocation: '0',
  recordOpenHash: '',
};

export const glabolSlice = createSlice({
  name: 'global',
  initialState,
  reducers: {
    clearglabol: () => initialState,
    setTaxZoneRates: (state, { payload }: PayloadAction<TaxZoneRatesProps[]>) => {
      state.taxZoneRates = payload;
    },
    setGlabolCommonState: (state, { payload }: PayloadAction<Partial<GlabolState>>) => ({
      ...state,
      ...payload,
    }),
    setOpenPageReducer: (
      state,
      { payload }: PayloadAction<Dispatch<SetStateAction<OpenPageState>>>,
    ) => {
      state.setOpenPageFn = payload;
    },
    setShowInclusiveTaxPrice: (state, { payload }: PayloadAction<boolean>) => {
      state.showInclusiveTaxPrice = payload;
    },
    setBlockPendingAccountViewPrice: (state, { payload }: PayloadAction<boolean>) => {
      state.blockPendingAccountViewPrice = payload;
    },
    setBlockPendingQuoteNonPurchasableOOS: (
      state,
      { payload }: PayloadAction<GlobalBlockPendingQuoteNonPurchasableOOS>,
    ) => {
      state.blockPendingQuoteNonPurchasableOOS = {
        ...state.blockPendingQuoteNonPurchasableOOS,
        ...payload,
      };
    },
    setLoginLandingLocation: (state, { payload }: PayloadAction<string>) => {
      state.loginLandingLocation = payload;
    },
    setCartNumber: (state, { payload }: PayloadAction<number>) => {
      state.cartNumber = payload;
    },
    setStoreInfo: (state, { payload }: PayloadAction<StoreInfoProps>) => {
      state.storeInfo = payload;
    },
  },
});

export const {
  clearglabol,
  setTaxZoneRates,
  setGlabolCommonState,
  setOpenPageReducer,
  setShowInclusiveTaxPrice,
  setBlockPendingAccountViewPrice,
  setBlockPendingQuoteNonPurchasableOOS,
  setCartNumber,
  setStoreInfo,
  setLoginLandingLocation,
} = glabolSlice.actions;

export default glabolSlice.reducer;
