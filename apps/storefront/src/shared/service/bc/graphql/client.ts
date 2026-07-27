import { isBigCommercePlatform } from '@/utils/basicConfig';

import B3Request from '../../request/b3Fetch';

export function storefrontGQLRequest<T = any>(data: {
  query: string;
  variables?: object;
}): Promise<T> {
  return isBigCommercePlatform() ? B3Request.graphqlBC<T>(data) : B3Request.graphqlBCProxy<T>(data);
}
