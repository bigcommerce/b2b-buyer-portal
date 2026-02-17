import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import { getGlobalTranslations, getPageTranslations } from '../appAsyncThunks';

export interface LangState {
  translations: Record<string, string>;
  fetchedPages: string[];
  translationVersion: number;
  locale: string;
}

const initialState: LangState = {
  translations: {},
  fetchedPages: [],
  translationVersion: 0,
  locale: 'en',
};

export const langSlice = createSlice({
  name: 'lang',
  initialState,
  reducers: {
    resetTranslations: (state) => {
      state.translations = {};
      state.fetchedPages = [];
      state.translationVersion = 0;
    },
    setLocale: (state, action: PayloadAction<string>) => {
      state.locale = action.payload;
    },
  },
  extraReducers(builder) {
    builder.addCase(getGlobalTranslations.fulfilled, (state, { payload }) => {
      Object.entries(payload.globalTranslations).forEach(([key, translation]) => {
        state.translations[key] = translation;
      });
      state.translationVersion = payload.newVersion;
      state.fetchedPages = ['global'];
    });
    builder.addCase(getPageTranslations.fulfilled, (state, { payload }) => {
      Object.entries(payload.pageTranslations).forEach(([key, translation]) => {
        state.translations[key] = translation;
      });
      state.fetchedPages.push(payload.page);
    });
  },
});

export const { resetTranslations, setLocale } = langSlice.actions;

export default persistReducer({ key: 'lang', storage }, langSlice.reducer);
