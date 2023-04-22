import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice, Draft } from '@reduxjs/toolkit'

export interface ThemeState {
  themeFrame?: Document
}

const initialState: ThemeState = {
  themeFrame: undefined,
}

export const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    clearThemeFrame: () => initialState,
    setThemeFrame: (state, { payload }: PayloadAction<Document>) => {
      state.themeFrame = payload as Draft<Document>
    },
  },
})

export const { clearThemeFrame, setThemeFrame } = themeSlice.actions

export default themeSlice.reducer
