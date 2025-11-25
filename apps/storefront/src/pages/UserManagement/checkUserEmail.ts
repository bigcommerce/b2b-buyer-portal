import B3Request from '@/shared/service/request/b3Fetch';
import { UserTypes } from '@/types';
import { storeHash } from '@/utils/basicConfig';

const toNumberSafely = (value?: number | string): number | undefined =>
  value !== undefined && value !== '' ? Number(value) : undefined;

const checkUserB2BEmail = `
  query UserEmailCheck ($email: String!, $companyId: Int, $storeHash: String!, $channelId: Int) {
    userEmailCheck ( email: $email, companyId: $companyId, storeHash: $storeHash, channelId: $channelId ){
      userType,
      userInfo {
        companyName
      }
    }
  }
`;

interface UserEmailCheckResponse {
  data: {
    userEmailCheck: {
      userType: UserTypes;
      userInfo: {
        companyName: string | null;
      };
    };
  };
}

interface CheckUserEmailVariables {
  email: string;
  companyId?: number | string;
  channelId?: number | string;
}

export const checkUserEmail = (variables: CheckUserEmailVariables) =>
  B3Request.graphqlB2B<UserEmailCheckResponse>({
    query: checkUserB2BEmail,
    variables: {
      email: variables.email,
      companyId: toNumberSafely(variables.companyId),
      channelId: toNumberSafely(variables.channelId),
      storeHash,
    },
  }).then((res) => ({
    ...res.userEmailCheck,
    isValid: res.userEmailCheck.userType === UserTypes.DOES_NOT_EXIST,
  }));
