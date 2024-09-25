import { convertObjectOrArrayKeysToCamel } from '@/utils';

import B3Request from '../../request/b3Fetch';

interface ApiTokenConfig {
  storeHash: string;
  channel_id: number;
  expires_at: number;
  allowed_cors_origins: string[];
}

const storeFrontToken = `mutation storeFrontToken($storeFrontTokenData: CustomerStoreFrontTokenInputType!) {
  storeFrontToken(storeFrontTokenData: $storeFrontTokenData) {
    token
  }
}
`;

export const getBCGraphqlToken = (data: Partial<ApiTokenConfig>) =>
  B3Request.graphqlB2B({
    query: storeFrontToken,
    variables: { storeFrontTokenData: convertObjectOrArrayKeysToCamel(data) },
  });
