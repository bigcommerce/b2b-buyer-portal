import { platform } from '@/utils/basicConfig';
import { convertObjectOrArrayKeysToCamel } from '@/utils/graphqlDataConvert';

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

interface BCPermission {
  code: string;
  permissionLevel: number;
}

interface BCAuthorizationInput {
  bcToken: string;
  channelId: number;
}

interface BCAuthorizationResponse {
  authorization?: {
    result?: {
      permissions: BCPermission[];
    };
  };
  errors?: Array<{ message: string }>;
}

const GET_BC_AUTHORIZATION = `mutation BCAuthorization($authData: UserAuthType!) {
  authorization(authData: $authData) {
    result {
      permissions {
        code
        permissionLevel
      }
    }
  }
}`;

export async function bcAuthorization(
  authData: BCAuthorizationInput,
): Promise<BCAuthorizationResponse> {
  return B3Request.graphqlB2B<BCAuthorizationResponse>({
    query: GET_BC_AUTHORIZATION,
    variables: { authData },
  });
}
