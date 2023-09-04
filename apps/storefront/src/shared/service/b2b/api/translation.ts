import { storeHash } from '@/utils'

import B3Request from '../../request/b3Fetch'
import { RequestType } from '../../request/base'

interface GetTranslationParams {
  channelId: number
  page: string
}
interface GetTranslationResponse {
  message: Record<string, string> | string
}

const { VITE_TRANSLATION_SERVICE_URL } = import.meta.env

const getTranslation = ({ channelId, page }: GetTranslationParams) =>
  B3Request.get(
    `${VITE_TRANSLATION_SERVICE_URL}/storefront/translation/${storeHash}/${channelId}/${page}`,
    RequestType.TranslationService
  ) as Promise<GetTranslationResponse>

export default getTranslation
