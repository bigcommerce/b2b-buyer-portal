import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { isEqual, pick } from 'lodash-es';
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
import {
  mergeLegacyOptionsText,
  mergeOptionsText,
} from '@/utils/b3Product/shared/mergeOptionsText';

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

type LocalizedDraftProduct = QuoteItem['node']['productsSearch'];

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
    totalIsTbd: false,
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
    resetDraftQuote: (state) => {
      state.draftQuoteList = initialState.draftQuoteList;
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
    refreshDraftProductsLocalization: (
      state,
      { payload }: PayloadAction<LocalizedDraftProduct[]>,
    ) => {
      state.draftQuoteList.forEach(({ node }) => {
        const localized = payload.find(({ id }) => Number(id) === Number(node.productsSearch?.id));

        if (!localized) return;

        const stored = node.productsSearch;

        // Only translated text is taken from the new search result. Which options exist, their
        // defaults, inventory, availability and price visibility stay as stored, so the options
        // that are submitted and the draft warnings don't change on a language refresh.
        const translated = {
          name: localized.name,
          options: mergeLegacyOptionsText(stored.options, localized.options),
          optionsV3: mergeOptionsText(stored.optionsV3, localized.optionsV3),
          modifiers: mergeOptionsText(stored.modifiers, localized.modifiers),
          allOptions: mergeOptionsText(stored.allOptions, localized.allOptions),
        };

        // Nothing is written when the text is already up to date, so the state keeps its identity
        // and the refresh can run after every draft change without causing another one.
        if (node.productName !== localized.name) {
          node.productName = localized.name;
        }

        if (!isEqual(pick(stored, Object.keys(translated)), translated)) {
          node.productsSearch = { ...stored, ...translated };
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
  resetDraftQuote,
  setDraftQuoteList,
  deleteProductFromDraftQuoteList,
  setDraftProductQuantity,
  setDraftProduct,
  refreshDraftProductsLocalization,
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
