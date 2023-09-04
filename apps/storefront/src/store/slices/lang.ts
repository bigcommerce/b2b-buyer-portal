import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface LangState {
  translations: Record<string, string>
}

const initialState: LangState = {
  translations: JSON.parse(localStorage.getItem('sf-translations') || '{}'),
}

const langSlice = createSlice({
  name: 'lang',
  initialState,
  reducers: {
    setTranslations: (
      state,
      { payload }: PayloadAction<LangState['translations']>
    ) => {
      state.translations = payload
    },
    updateTranslations: (
      state,
      { payload }: PayloadAction<LangState['translations']>
    ) => {
      state.translations = { ...state.translations, ...payload }
    },
  },
})

export const { setTranslations, updateTranslations } = langSlice.actions

export default langSlice.reducer
