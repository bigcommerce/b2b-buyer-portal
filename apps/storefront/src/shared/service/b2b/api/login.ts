import B3Request from '../../request/b3Fetch';
import { RequestType } from '../../request/base';

interface ApiTokenConfig {
  storeHash: string;
  channel_id: number;
  expires_at: number;
  allowed_cors_origins: string[];
}

const getBCGraphqlToken = (data: Partial<ApiTokenConfig>) =>
  B3Request.post('/api/v2/bc/storefront/api-token', RequestType.B2BRest, data);

export default getBCGraphqlToken;
