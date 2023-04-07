import {
  Draft,
  createSlice,
} from '@reduxjs/toolkit'
import type {
  PayloadAction,
} from '@reduxjs/toolkit'

export interface themeState {
  themeFrame?: Document
}

const initialState: themeState = {
  themeFrame: undefined,
}

export const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    clearThemeFrame: () => initialState,
    setThemeFrame: (state, {
      payload,
    }: PayloadAction<Document>) => {
      state.themeFrame = payload as Draft<Document>
    },
  },
})

export const {
  clearThemeFrame,
  setThemeFrame,
} = themeSlice.actions

export default themeSlice.reducer
