import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import {
  BillingAddress,
  CalculatedValue,
  QuoteInfo,
  QuoteItem,
  ShippingAddress,
} from '@/types/quotes';

interface SetDraftProductQuantityParams {
  id: string;
  quantity: number;
}

interface SetDraftProductParams {
  id: string;
  product: QuoteItem;
}

interface SetDraftProductCalculatedValueParams {
  index: number;
  calculatedValue: CalculatedValue;
}

export interface QuoteInfoState {
  draftQuoteList: QuoteItem[];
  draftQuoteInfo: QuoteInfo;
  quoteDetailToCheckoutUrl: string;
}

const initialState: QuoteInfoState = {
  draftQuoteList: [],
  draftQuoteInfo: {
    userId: 0,
    contactInfo: {
      name: '',
      email: '',
      companyName: '',
      phoneNumber: '',
      quoteTitle: '',
    },
    shippingAddress: {
      address: '',
      addressId: 0,
      apartment: '',
      companyName: '',
      city: '',
      country: '',
      firstName: '',
      label: '',
      lastName: '',
      phoneNumber: '',
      state: '',
      zipCode: '',
    },
    billingAddress: {
      address: '',
      addressId: 0,
      apartment: '',
      companyName: '',
      city: '',
      country: '',
      firstName: '',
      label: '',
      lastName: '',
      phoneNumber: '',
      state: '',
      zipCode: '',
    },
    fileInfo: [],
    note: '',
    referenceNumber: '',
    extraFields: [],
    recipients: [],
  },
  quoteDetailToCheckoutUrl: '',
};

const draftQuoteListSlice = createSlice({
  name: 'quoteInfo',
  initialState,
  reducers: {
    resetDraftQuoteList: (state) => {
      state.draftQuoteList = initialState.draftQuoteList;
    },
    resetDraftQuoteInfo: (state) => {
      state.draftQuoteInfo = initialState.draftQuoteInfo;
    },
    setDraftQuoteList: (state, { payload }: PayloadAction<QuoteItem[]>) => {
      state.draftQuoteList = payload;
    },
    deleteProductFromDraftQuoteList: (state, { payload }: PayloadAction<string>) => {
      const index = state.draftQuoteList.findIndex((item) => item.node.id === payload);

      state.draftQuoteList.splice(index, 1);
    },
    setDraftProductQuantity: (state, { payload }: PayloadAction<SetDraftProductQuantityParams>) => {
      const index = state.draftQuoteList.findIndex((item) => item.node.id === payload.id);

      state.draftQuoteList[index].node.quantity = payload.quantity;
    },
    setDraftProduct: (state, { payload }: PayloadAction<SetDraftProductParams>) => {
      state.draftQuoteList.forEach((item) => {
        if (item.node.id === payload.id) {
          item.node = payload.product.node;
        }
      });
    },
    setDraftProductCalculatedValue: (
      state,
      { payload }: PayloadAction<SetDraftProductCalculatedValueParams>,
    ) => {
      state.draftQuoteList[payload.index].node.calculatedValue = payload.calculatedValue;
    },
    setDraftQuoteCalculatedPrices: (
      state,
      { payload }: PayloadAction<{ startIndex: number; endIndex: number }>,
    ) => {
      state.draftQuoteList.slice(payload.startIndex, payload.endIndex).forEach((item) => {
        if (Array.isArray(item.node.additionalCalculatedPrices)) {
          item.node.additionalCalculatedPrices.forEach((additionalCalculatedPrice) => {
            item.node.basePrice += additionalCalculatedPrice.additionalCalculatedPriceTax;
            item.node.taxPrice += additionalCalculatedPrice.additionalCalculatedPrice;
          });
        }
      });
    },
    setQuoteUserId: (state, { payload }: PayloadAction<number>) => {
      state.draftQuoteInfo.userId = payload;
    },
    setDraftQuoteInfo: (state, { payload }: PayloadAction<QuoteInfo>) => {
      state.draftQuoteInfo = payload;
    },
    setDraftQuoteInfoNote: (state, { payload }: PayloadAction<string>) => {
      state.draftQuoteInfo.note = payload;
    },
    setDraftQuoteShippingAddress: (state, { payload }: PayloadAction<ShippingAddress>) => {
      state.draftQuoteInfo.shippingAddress = payload;
    },
    setDraftQuoteBillingAddress: (state, { payload }: PayloadAction<BillingAddress>) => {
      state.draftQuoteInfo.billingAddress = payload;
    },
    setQuoteDetailToCheckoutUrl: (state, { payload }: PayloadAction<string>) => {
      state.quoteDetailToCheckoutUrl = payload;
    },
  },
});

export const {
  resetDraftQuoteList,
  resetDraftQuoteInfo,
  setDraftQuoteList,
  deleteProductFromDraftQuoteList,
  setDraftProductQuantity,
  setDraftProduct,
  setDraftProductCalculatedValue,
  setDraftQuoteCalculatedPrices,
  setQuoteUserId,
  setDraftQuoteInfo,
  setDraftQuoteInfoNote,
  setDraftQuoteShippingAddress,
  setDraftQuoteBillingAddress,
  setQuoteDetailToCheckoutUrl,
} = draftQuoteListSlice.actions;

export default persistReducer({ key: 'quoteInfo', storage }, draftQuoteListSlice.reducer);
