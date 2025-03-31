import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import { Dispatch, SetStateAction } from 'react';

import { OpenPageState } from '@/types/hooks';
import { LOGIN_LANDING_LOCATIONS } from '@/constants';

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

interface QuoteSubmissionResponseProps {
  value: string;
  key: string;
  message: string;
  title: string;
}

export interface GlobalState {
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
  quoteSubmissionResponse: QuoteSubmissionResponseProps;
  isOpenCompanyHierarchyDropDown: boolean;
}

const initialState: GlobalState = {
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
  loginLandingLocation: LOGIN_LANDING_LOCATIONS.BUYER_PORTAL,
  recordOpenHash: '',
  quoteSubmissionResponse: {
    value: '0',
    key: 'quote_submission_response',
    message: '',
    title: '',
  },
  isOpenCompanyHierarchyDropDown: false,
};

export const globalSlice = createSlice({
  name: 'global',
  initialState,
  reducers: {
    clearGlobal: () => initialState,
    setTaxZoneRates: (state, { payload }: PayloadAction<TaxZoneRatesProps[]>) => {
      state.taxZoneRates = payload;
    },
    setGlobalCommonState: (state, { payload }: PayloadAction<Partial<GlobalState>>) => ({
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
    setQuoteSubmissionResponse: (
      state,
      { payload }: PayloadAction<QuoteSubmissionResponseProps>,
    ) => {
      state.quoteSubmissionResponse = payload;
    },
    setOpenCompanyHierarchyDropDown: (state, { payload }: PayloadAction<boolean>) => {
      state.isOpenCompanyHierarchyDropDown = payload;
    },
  },
});

export const {
  clearGlobal,
  setTaxZoneRates,
  setGlobalCommonState,
  setOpenPageReducer,
  setShowInclusiveTaxPrice,
  setBlockPendingAccountViewPrice,
  setBlockPendingQuoteNonPurchasableOOS,
  setCartNumber,
  setStoreInfo,
  setLoginLandingLocation,
  setQuoteSubmissionResponse,
  setOpenCompanyHierarchyDropDown,
} = globalSlice.actions;

export default globalSlice.reducer;
