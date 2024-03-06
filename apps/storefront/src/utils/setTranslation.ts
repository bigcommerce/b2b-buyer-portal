import { getTranslation } from '@/shared/service/b2b'
import { setTranslations, store, updateTranslations } from '@/store'

import { B3LStorage } from './b3Storage'

interface SetGlobalTranslationParams {
  channelId: number
  translationVersion: number
}
interface SetTranslationParams {
  channelId: number
  page: string
}

const REPEATED_PAGES = {
  'company-orders': 'orders',
}

export const setGlobalTranslation = async ({
  channelId,
  translationVersion,
}: SetGlobalTranslationParams) => {
  const prevtTranslationVersion = B3LStorage.get('translationVersion')
  if (prevtTranslationVersion === translationVersion) return

  const { message } = await getTranslation({ channelId, page: 'global' })

  if (typeof message === 'object') {
    B3LStorage.set('translationVersion', translationVersion)
    B3LStorage.set('translations', message)
    B3LStorage.set('fetchedPages', ['global'])
    store.dispatch(setTranslations(message))
  }
}

export const setTranslation = async ({
  channelId,
  page: pageKey,
}: SetTranslationParams) => {
  const page =
    pageKey in REPEATED_PAGES
      ? REPEATED_PAGES[pageKey as keyof typeof REPEATED_PAGES]
      : pageKey
  const translationVersion = B3LStorage.get('translationVersion')
  const fetchedPages = B3LStorage.get('fetchedPages')

  if (fetchedPages?.includes(page) || !(translationVersion > 0)) return

  const translations = B3LStorage.get('translations')
  const { message } = await getTranslation({ channelId, page })

  if (typeof message === 'object') {
    fetchedPages.push(page)
    B3LStorage.set('translations', { ...translations, ...message })
    B3LStorage.set('fetchedPages', fetchedPages)
    store.dispatch(updateTranslations(message))
  }
}
