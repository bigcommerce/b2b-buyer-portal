import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'

import { CalculatedValue, QuoteItem } from '@/types/quotes'

interface SetDraftProductQuantityParams {
  id: string
  quantity: number
}

interface SetDraftProductParams {
  id: string
  product: QuoteItem
}

interface SetDraftProductCalculatedValueParams {
  index: number
  calculatedValue: CalculatedValue
}

export interface QuoteInfoState {
  draftQuoteList: QuoteItem[]
}

const initialState: QuoteInfoState = {
  draftQuoteList: [],
}

const draftQuoteListSlice = createSlice({
  name: 'quoteInfo',
  initialState,
  reducers: {
    resetDraftQuoteList: (state) => {
      state.draftQuoteList = initialState.draftQuoteList
    },
    setDraftQuoteList: (state, { payload }: PayloadAction<QuoteItem[]>) => {
      state.draftQuoteList = payload
    },
    deleteProductFromDraftQuoteList: (
      state,
      { payload }: PayloadAction<string>
    ) => {
      const index = state.draftQuoteList.findIndex(
        (item) => item.node.id === payload
      )
      state.draftQuoteList.splice(index, 1)
    },
    setDraftProductQuantity: (
      state,
      { payload }: PayloadAction<SetDraftProductQuantityParams>
    ) => {
      const index = state.draftQuoteList.findIndex(
        (item) => item.node.id === payload.id
      )
      state.draftQuoteList[index].node.quantity = payload.quantity
    },
    setDraftProduct: (
      state,
      { payload }: PayloadAction<SetDraftProductParams>
    ) => {
      state.draftQuoteList.forEach((item) => {
        if (item.node.id === payload.id) {
          item.node = payload.product.node
        }
      })
    },
    setDraftProductCalculatedValue: (
      state,
      { payload }: PayloadAction<SetDraftProductCalculatedValueParams>
    ) => {
      state.draftQuoteList[payload.index].node.calculatedValue =
        payload.calculatedValue
    },
    setDraftQuoteCalculatedPrices: (
      state,
      { payload }: PayloadAction<{ startIndex: number; endIndex: number }>
    ) => {
      state.draftQuoteList
        .slice(payload.startIndex, payload.endIndex)
        .forEach((item) => {
          if (Array.isArray(item.node.additionalCalculatedPrices)) {
            item.node.additionalCalculatedPrices.forEach(
              (additionalCalculatedPrice) => {
                item.node.basePrice +=
                  additionalCalculatedPrice.additionalCalculatedPriceTax
                item.node.taxPrice +=
                  additionalCalculatedPrice.additionalCalculatedPrice
              }
            )
          }
        })
    },
  },
})

export const {
  resetDraftQuoteList,
  setDraftQuoteList,
  deleteProductFromDraftQuoteList,
  setDraftProductQuantity,
  setDraftProduct,
  setDraftProductCalculatedValue,
  setDraftQuoteCalculatedPrices,
} = draftQuoteListSlice.actions

export default persistReducer(
  { key: 'quoteInfo', storage },
  draftQuoteListSlice.reducer
)
