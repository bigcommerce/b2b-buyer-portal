import { storeHash } from '@/utils/basicConfig'

import { B2B_BASIC_URL } from '../../request/base'

interface GetTranslationParams {
  channelId: number
  page: string
}
interface GetTranslationResponse {
  message: Record<string, string> | string
}

const { VITE_TRANSLATION_SERVICE_URL } = import.meta.env

const BASE_URL = VITE_TRANSLATION_SERVICE_URL || B2B_BASIC_URL

const getTranslation = async ({ channelId, page }: GetTranslationParams) => {
  const response = await fetch(
    `${BASE_URL}/storefront/translation/${storeHash}/${channelId}/${page}`
  )
  return response.json() as Promise<GetTranslationResponse>
}
export default getTranslation
