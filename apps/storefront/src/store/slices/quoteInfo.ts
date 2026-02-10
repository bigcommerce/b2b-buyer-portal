import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { PersistConfig, PersistedState } from 'redux-persist';
import { getStoredState, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import storageSession from 'redux-persist/lib/storage/session';

import {
  BillingAddress,
  CalculatedValue,
  QuoteInfo,
  QuoteItem,
  ShippingAddress,
} from '@/types/quotes';
import b2bLogger from '@/utils/b3Logger';

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
    setDraftQuoteRecipients: (state, { payload }: PayloadAction<string[]>) => {
      state.draftQuoteInfo.recipients = payload;
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
  setDraftQuoteRecipients,
  setDraftQuoteInfoNote,
  setDraftQuoteShippingAddress,
  setDraftQuoteBillingAddress,
  setQuoteDetailToCheckoutUrl,
} = draftQuoteListSlice.actions;

export const persistConfig: PersistConfig<QuoteInfoState> = {
  key: 'quoteInfo',
  storage: storageSession,
  /* 
    We changed quoteinfo from localstorage to sessionStorage
    Therefore need to make sure that users which had draft quote in localstorage,
      we add it to sessionStorage and remove it from localStorage
  */
  getStoredState: async (config): Promise<PersistedState | undefined> => {
    try {
      // Try to load from the current engine (sessionStorage)
      const sessionState = await getStoredState(config);
      if (sessionState) return sessionState as PersistedState;

      // Fallback: Try to migrate from the old engine (localStorage)
      const localState = await getStoredState({ ...config, storage });

      if (localState) {
        // Delete the old key to prevent data duplication
        localStorage.removeItem(`persist:${config.key}`);
        return localState as PersistedState;
      }
    } catch (error) {
      b2bLogger.error('Migration from localStorage failed:', error);
    }
    return undefined; // Rehydrates with initial state if nothing found
  },
};

export default persistReducer(persistConfig, draftQuoteListSlice.reducer);
