import { storeHash } from '@/utils/basicConfig';

import { getAPIBaseURL } from '../../request/base';

interface GetTranslationParams {
  channelId: number;
  page: string;
  locale?: string;
}
interface GetTranslationResponse {
  message: Record<string, string> | string;
}

const getTranslation = async ({ channelId, page, locale }: GetTranslationParams) => {
  const base = `${getAPIBaseURL()}/storefront/translation/${storeHash}/${channelId}/${page}`;
  const url = locale ? `${base}?locale=${encodeURIComponent(locale)}` : base;
  const response = await fetch(url);
  return response.json() as Promise<GetTranslationResponse>;
};
export default getTranslation;
