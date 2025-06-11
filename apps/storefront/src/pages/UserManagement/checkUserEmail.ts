import B3Request from '@/shared/service/request/b3Fetch';
import { UserTypes } from '@/types';
import { storeHash } from '@/utils';

const checkUserB2BEmail = (data: CustomFieldItems) => `
  query UserEmailCheck {
    userEmailCheck (
      email: "${data.email}"
      companyId: ${data.companyId || null}
      storeHash: "${storeHash}"
      channelId: ${data.channelId || null}
    ){
      userType,
      userInfo{
        id
        email
        firstName
        lastName
        phoneNumber
        role
        companyName
        originChannelId
        forcePasswordReset
      }
    }
  }
`;

export interface UserEmailCheckResponse {
  data: {
    userEmailCheck: {
      userType: UserTypes;
      userInfo: {
        id: string | null;
        email: string | null;
        firstName: string | null;
        lastName: string | null;
        phoneNumber: string | null;
        role: string | null;
        companyName: string | null;
        originChannelId: string | null;
        forcePasswordReset: boolean | null;
      };
    };
  };
}

export const checkUserEmail = (data: CustomFieldItems) =>
  B3Request.graphqlB2B({
    query: checkUserB2BEmail(data),
  }).then((res) => ({
    ...res.userEmailCheck,
    isValid: res.userEmailCheck.userType === UserTypes.DOES_NOT_EXIST,
  }));
