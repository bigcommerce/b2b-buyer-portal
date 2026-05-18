import { createAsyncThunk } from '@reduxjs/toolkit';

import getTranslation from '@/shared/service/b2b/api/translation';

import type { AppDispatch, RootState } from '.';

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
  fetchedDependencyPages: string[];
}

const REPEATED_PAGES: Partial<Record<string, string>> = {
  'company-orders': 'orders',
};

/**
 * Pages that render shared components whose translation keys belong to another page.
 * When a page is visited, translations for its dependencies are also fetched.
 */
const TRANSLATION_DEPENDENCIES: Partial<Record<string, string[]>> = {
  quoteDetail: ['quoteDraft'],
};

export const getGlobalTranslations = createAppAsyncThunk<
  GetGlobalTranslationResponse,
  GetGlobalTranslationsParams
>(
  'lang/getGlobalTranslations',
  async ({ channelId, newVersion }, { rejectWithValue }) => {
    const { message } = await getTranslation({ channelId, page: 'global' });

    if (typeof message === 'string') {
      return rejectWithValue(message);
    }

    return { globalTranslations: message, newVersion };
  },
  {
    condition: ({ newVersion }, { getState }) => {
      const { translationVersion } = getState().lang;

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
    const { fetchedPages } = getState().lang;
    const dependencyPages = (TRANSLATION_DEPENDENCIES[page] ?? []).filter(
      (dep) => !fetchedPages.includes(dep),
    );

    const primaryResult = await getTranslation({ channelId, page });

    if (typeof primaryResult.message === 'string') {
      return rejectWithValue(primaryResult.message);
    }

    const dependencyResults = await Promise.allSettled(
      dependencyPages.map((p) => getTranslation({ channelId, page: p })),
    );

    const successfulDeps = dependencyResults
      .map((r, i) =>
        r.status === 'fulfilled' && typeof r.value.message !== 'string'
          ? { page: dependencyPages[i], translations: r.value.message as Record<string, string> }
          : null,
      )
      .filter(Boolean) as { page: string; translations: Record<string, string> }[];

    const pageTranslations = Object.assign(
      {},
      primaryResult.message as Record<string, string>,
      ...successfulDeps.map((d) => d.translations),
    );

    return { pageTranslations, page, fetchedDependencyPages: successfulDeps.map((d) => d.page) };
  },
  {
    condition: ({ page: pageKey }, { getState }) => {
      const page = REPEATED_PAGES[pageKey] ?? pageKey;
      const { fetchedPages, translationVersion } = getState().lang;

      // cancel request if page it's already fetched or translation version it's 0
      if (fetchedPages.includes(page) || translationVersion === 0) {
        return false;
      }

      return true;
    },
  },
);
