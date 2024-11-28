import { storeHash } from '@/utils/basicConfig';

import { B2B_API_BASE_URL } from '../../request/base';

interface GetTranslationParams {
  channelId: number;
  page: string;
}
interface GetTranslationResponse {
  message: Record<string, string> | string;
}

const getTranslation = async ({ channelId, page }: GetTranslationParams) => {
  const response = await fetch(
    `${B2B_API_BASE_URL}/storefront/translation/${storeHash}/${channelId}/${page}`,
  );
  return response.json() as Promise<GetTranslationResponse>;
};
export default getTranslation;
