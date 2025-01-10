import { storeHash } from '@/utils/basicConfig';

import { getAPIBaseURL } from '../../request/base';

interface GetTranslationParams {
  channelId: number;
  page: string;
}
interface GetTranslationResponse {
  message: Record<string, string> | string;
}

const getTranslation = async ({ channelId, page }: GetTranslationParams) => {
  const response = await fetch(
    `${getAPIBaseURL()}/storefront/translation/${storeHash}/${channelId}/${page}`,
  );
  return response.json() as Promise<GetTranslationResponse>;
};
export default getTranslation;
