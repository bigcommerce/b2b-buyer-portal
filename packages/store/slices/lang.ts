import {
  createSlice,
} from '@reduxjs/toolkit'
import type {
  PayloadAction,
} from '@reduxjs/toolkit'
import {
  LangUtils,
} from '@b3/utils'

const initialState: string = LangUtils.getBrowserLanguage()

export const langSlice = createSlice({
  name: 'lang',
  initialState,
  reducers: {
    updateLang: (state, action: PayloadAction<string>) => {
      const {
        payload,
      } = action
      state = payload
    },
  },
})

export const {
  updateLang,
} = langSlice.actions

export default langSlice.reducer
