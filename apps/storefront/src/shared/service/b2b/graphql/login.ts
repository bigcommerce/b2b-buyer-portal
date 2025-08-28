import { convertObjectOrArrayKeysToCamel, platform } from '@/utils';

import B3Request from '../../request/b3Fetch';

interface ApiTokenConfig {
  storeHash: string;
  channel_id: number;
  expires_at: number;
  allowed_cors_origins: string[] | Location[];
}

const storeFrontToken = `mutation storeFrontToken($storeFrontTokenData: CustomerStoreFrontTokenInputType!) {
  storeFrontToken(storeFrontTokenData: $storeFrontTokenData) {
    token
  }
}
`;

export const getBCGraphqlToken = (data: Partial<ApiTokenConfig>): Promise<string> | undefined => {
  if (platform !== 'bigcommerce') {
    return undefined;
  }

  return B3Request.graphqlB2B({
    query: storeFrontToken,
    variables: { storeFrontTokenData: convertObjectOrArrayKeysToCamel(data) },
  }).then((res) => res.storeFrontToken.token);
};
