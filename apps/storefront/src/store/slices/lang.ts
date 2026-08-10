import { createSlice } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import { getGlobalTranslations, getPageTranslations } from '../appAsyncThunks';

export interface LangState {
  translations: Record<string, string>;
  fetchedPages: string[];
  translationVersion: number;
}

const initialState: LangState = {
  translations: {},
  fetchedPages: [],
  translationVersion: 0,
};

// LOCAL-3191.B2B_multi_language: a page response is authoritative for that
// page's namespace (the key segment before the first dot) - phrases deleted by
// the merchant are simply absent from it. Merging would keep deleted phrases
// alive in persisted storage forever, so drop the fetched pages' stored keys
// before applying the response. Other pages keep their keys until they are
// refetched themselves.
const replacePageTranslations = (
  state: LangState,
  pages: string[],
  translations: Record<string, string>,
) => {
  Object.keys(state.translations).forEach((key) => {
    if (pages.includes(key.split('.')[0])) {
      delete state.translations[key];
    }
  });
  Object.entries(translations).forEach(([key, translation]) => {
    state.translations[key] = translation;
  });
};

export const langSlice = createSlice({
  name: 'lang',
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder.addCase(getGlobalTranslations.fulfilled, (state, { payload }) => {
      if (payload.multiLanguageEnabled) {
        replacePageTranslations(state, ['global'], payload.globalTranslations);
      } else {
        Object.entries(payload.globalTranslations).forEach(([key, translation]) => {
          state.translations[key] = translation;
        });
      }
      state.translationVersion = payload.newVersion;
      // Resetting fetchedPages forces every other page to refetch this session,
      // which is when its stale phrases get replaced.
      state.fetchedPages = ['global'];
    });
    builder.addCase(getPageTranslations.fulfilled, (state, { payload }) => {
      if (payload.multiLanguageEnabled) {
        replacePageTranslations(
          state,
          [payload.page, ...payload.fetchedDependencyPages],
          payload.pageTranslations,
        );
      } else {
        Object.entries(payload.pageTranslations).forEach(([key, translation]) => {
          state.translations[key] = translation;
        });
      }
      state.fetchedPages.push(payload.page, ...payload.fetchedDependencyPages);
    });
  },
});

export default persistReducer({ key: 'lang', storage }, langSlice.reducer);
