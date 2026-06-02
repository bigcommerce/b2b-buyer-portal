import { platform } from '@/utils/basicConfig';

import B3Request from '../../request/b3Fetch';

export function storefrontGQLRequest<T>(data: { query: string; variables?: object }): Promise<T> {
  return platform === 'bigcommerce'
    ? B3Request.graphqlBC<T>(data)
    : B3Request.graphqlBCProxy<T>(data);
}
