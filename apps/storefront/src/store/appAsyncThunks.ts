import { createAsyncThunk } from '@reduxjs/toolkit';

import getTranslation from '@/shared/service/b2b/api/translation';
import { getActiveLocale } from '@/utils/locale';

import type { AppDispatch, RootState } from '.';

const resolveActiveLocaleCode = (state: RootState) => {
  const { featureFlags, locales } = state.global;
  if (!featureFlags['LOCAL-3191.B2B_multi_language']) {
    return undefined;
  }
  return getActiveLocale(locales)?.code;
};

const createAppAsyncThunk = createAsyncThunk.withTypes<{
  state: RootState;
  dispatch: AppDispatch;
}>();

interface GetGlobalTranslationsParams {
  channelId: number;
  newVersion: number;
}

interface GetGlobalTranslationResponse {
  globalTranslations: Record<string, string>;
  newVersion: number;
}

interface GetPageTranslationsParams {
  channelId: number;
  page: string;
}

interface GetPageTranslationResponse {
  pageTranslations: Record<string, string>;
  page: string;
}

const REPEATED_PAGES: Partial<Record<string, string>> = {
  'company-orders': 'orders',
};

export const getGlobalTranslations = createAppAsyncThunk<
  GetGlobalTranslationResponse,
  GetGlobalTranslationsParams
>(
  'lang/getGlobalTranslations',
  async ({ channelId, newVersion }, { rejectWithValue, getState }) => {
    const locale = resolveActiveLocaleCode(getState());
    const { message } = await getTranslation({ channelId, page: 'global', locale });

    if (typeof message === 'string') {
      return rejectWithValue(message);
    }

    return { globalTranslations: message, newVersion };
  },
  {
    condition: ({ newVersion }, { getState }) => {
      const state = getState();
      if (state.global.featureFlags['LOCAL-3191.B2B_multi_language']) {
        return true;
      }
      const { translationVersion } = state.lang;

      // cancel request if new version it's 0 or similar to previous value
      if (newVersion === 0 || translationVersion === newVersion) {
        return false;
      }

      return true;
    },
  },
);
export const getPageTranslations = createAppAsyncThunk<
  GetPageTranslationResponse,
  GetPageTranslationsParams
>(
  'lang/getPageTranslations',
  async ({ channelId, page: pageKey }, { rejectWithValue, getState }) => {
    const page = REPEATED_PAGES[pageKey] ?? pageKey;
    const locale = resolveActiveLocaleCode(getState());
    const { message } = await getTranslation({ channelId, page, locale });

    if (typeof message === 'string') {
      return rejectWithValue(message);
    }

    return { pageTranslations: message, page };
  },
  {
    condition: ({ page: pageKey }, { getState }) => {
      const state = getState();
      if (state.global.featureFlags['LOCAL-3191.B2B_multi_language']) {
        return true;
      }
      const page = REPEATED_PAGES[pageKey] ?? pageKey;
      const { fetchedPages, translationVersion } = state.lang;

      // cancel request if page it's already fetched or translation version it's 0
      if (fetchedPages.includes(page) || translationVersion === 0) {
        return false;
      }

      return true;
    },
  },
);
