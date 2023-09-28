import { storeHash } from '@/utils'

import B3Request from '../../request/b3Fetch'
import { B2B_BASIC_URL, RequestType } from '../../request/base'

interface GetTranslationParams {
  channelId: number
  page: string
}
interface GetTranslationResponse {
  message: Record<string, string> | string
}

const { VITE_TRANSLATION_SERVICE_URL } = import.meta.env

const BASE_URL = VITE_TRANSLATION_SERVICE_URL || B2B_BASIC_URL

const getTranslation = ({ channelId, page }: GetTranslationParams) =>
  B3Request.get(
    `${BASE_URL}/storefront/translation/${storeHash}/${channelId}/${page}`,
    RequestType.TranslationService
  ) as Promise<GetTranslationResponse>

export default getTranslation
