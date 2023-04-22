import { LangUtils } from '@b3/utils'
import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'

const initialState: string = LangUtils.getBrowserLanguage()

export const langSlice = createSlice({
  name: 'lang',
  initialState,
  reducers: {
    updateLang: (state, action: PayloadAction<string>) => {
      const { payload } = action
      state = payload
    },
  },
})

export const { updateLang } = langSlice.actions

export default langSlice.reducer
