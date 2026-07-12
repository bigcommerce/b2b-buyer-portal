import { isBigCommercePlatform } from '@/utils/basicConfig';
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
  if (!isBigCommercePlatform()) {
    return undefined;
  }
  return B3Request.graphqlB2B({
    query: storeFrontToken,
    variables: { storeFrontTokenData: convertObjectOrArrayKeysToCamel(data) },
  }).then((res) => res.storeFrontToken.token);
};

interface B2BAuthorizationPermission {
  code: string;
  permissionLevel: number;
}

interface B2BAuthorizationInput {
  bcToken: string;
  channelId: number;
}

interface B2BAuthorizationResponse {
  authorization?: {
    result?: {
      permissions: B2BAuthorizationPermission[];
    };
  };
  errors?: Array<{ message: string }>;
}

const GET_B2B_AUTHORIZATION = `mutation B2BAuthorization($authData: UserAuthType!) {
  authorization(authData: $authData) {
    result {
      permissions {
        code
        permissionLevel
      }
    }
  }
}`;

export async function b2bAuthorization(
  authData: B2BAuthorizationInput,
): Promise<B2BAuthorizationResponse> {
  return B3Request.graphqlB2B<B2BAuthorizationResponse>({
    query: GET_B2B_AUTHORIZATION,
    variables: { authData },
  });
}
