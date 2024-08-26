import { convertArrayToGraphql } from '@/utils';

import B3Request from '../../request/b3Fetch';

interface ApiTokenConfig {
  storeHash: string;
  channel_id: number;
  expires_at: number;
  allowed_cors_origins: string[];
}

const storeFrontToken = (data: Partial<ApiTokenConfig>) => `mutation {
  storeFrontToken (
    storeFrontTokenData: {
      storeHash: "${data?.storeHash}",
      channelId: ${data.channel_id},
      expiresAt: ${data.expires_at},
      allowedCorsOrigins: ${convertArrayToGraphql(data.allowed_cors_origins || [])},
    }
  ) {
    token
  }
}`;

const getBCGraphqlToken = (data: Partial<ApiTokenConfig>) =>
  B3Request.graphqlB2B({
    query: storeFrontToken(data),
  });

export default getBCGraphqlToken;
