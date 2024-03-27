import getTranslation from '@/shared/service/b2b/api/translation'

import createAppAsyncThunk from './createAppAsyncThunk'

interface GetGlobalTranslationsParams {
  channelId: number
  newVersion: number
}
interface GetGlobalTranslationResponse {
  globalTranslations: Record<string, string>
  newVersion: number
}
interface GetPageTranslationsParams {
  channelId: number
  page: string
}
interface GetPageTranslationResponse {
  pageTranslations: Record<string, string>
  page: string
}

const REPEATED_PAGES = {
  'company-orders': 'orders',
}
export const getGlobalTranslations = createAppAsyncThunk<
  GetGlobalTranslationResponse,
  GetGlobalTranslationsParams
>(
  'lang/getGlobalTranslations',
  async ({ channelId, newVersion }, { rejectWithValue }) => {
    const { message } = await getTranslation({ channelId, page: 'global' })
    if (typeof message === 'string') return rejectWithValue(message)

    return { globalTranslations: message, newVersion }
  },
  {
    condition: ({ newVersion }, { getState }) => {
      const { translationVersion } = getState().lang
      // cancel request if new version it's 0 or similar to previous value
      if (newVersion === 0 || translationVersion === newVersion) {
        return false
      }

      return true
    },
  }
)
export const getPageTranslations = createAppAsyncThunk<
  GetPageTranslationResponse,
  GetPageTranslationsParams
>(
  'lang/getPageTranslations',
  async ({ channelId, page: pageKey }, { rejectWithValue }) => {
    const page =
      pageKey in REPEATED_PAGES
        ? REPEATED_PAGES[pageKey as keyof typeof REPEATED_PAGES]
        : pageKey
    const { message } = await getTranslation({ channelId, page })
    if (typeof message === 'string') return rejectWithValue(message)

    return { pageTranslations: message, page }
  },
  {
    condition: ({ page: pageKey }, { getState }) => {
      const page =
        pageKey in REPEATED_PAGES
          ? REPEATED_PAGES[pageKey as keyof typeof REPEATED_PAGES]
          : pageKey
      const { fetchedPages, translationVersion } = getState().lang
      // cancel request if page it's already fetched or translation version it's 0
      if (fetchedPages.includes(page) || translationVersion === 0) {
        return false
      }
      return true
    },
  }
)
