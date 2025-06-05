import { UserTypes } from '@/types';

import { storeHash } from '../../../../utils';
import B3Request from '../../request/b3Fetch';

const deleteUsersQl = (data: CustomFieldItems) => `
  mutation DeleteUser {
    userDelete (
      companyId: ${data.companyId}
      userId: ${data.userId}
    ) {
      message
    }
  }
`;

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

const checkCustomerBCEmail = (data: CustomFieldItems) => `{
  customerEmailCheck (
    email: "${data.email}"
    storeHash: "${storeHash}"
    channelId: ${data.channelId || null}
  ){
    userType,
  }
}`;

const getUserExtraFields = () => `
  query GetUserExtraFields {
    userExtraFields {
      fieldName
      fieldType
      isRequired
      defaultValue
      maximumLength
      numberOfRows
      maximumValue
      listOfValue
      visibleToEnduser
      labelName
    }
  }
`;

export interface UsersResponse {
  data: {
    users: {
      totalCount: number;
      pageInfo: { hasNextPage: boolean; hasPreviousPage: boolean };
      edges: Array<{
        node: {
          id: string;
          createdAt: number;
          updatedAt: number;
          firstName: string;
          lastName: string;
          email: string;
          phone: string;
          bcId: number;
          role: number;
          uuid: string | null;
          extraFields: { fieldName: string; fieldValue: string }[];
          companyRoleId: number;
          companyRoleName: string;
          masqueradingCompanyId: string | null;
          companyInfo: {
            companyId: string;
            companyName: string;
            companyAddress: string;
            companyCountry: string;
            companyState: string;
            companyCity: string;
            companyZipCode: string;
            phoneNumber: string;
            bcId: string;
          };
        };
      }>;
    };
  };
}

export interface UserExtraFieldsInfoResponse {
  data: {
    userExtraFields: Array<{
      fieldName: string;
      fieldType: number;
      isRequired: boolean;
      defaultValue: string | null;
      maximumLength: string | null;
      numberOfRows: number | null;
      maximumValue: string | null;
      listOfValue: string[] | null;
      visibleToEnduser: boolean;
      labelName: string;
    }>;
  };
}

export const getUsersExtraFieldsInfo = () =>
  B3Request.graphqlB2B({
    query: getUserExtraFields(),
  });

export const deleteUsers = (data: CustomFieldItems) =>
  B3Request.graphqlB2B({
    query: deleteUsersQl(data),
  });

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

export const checkUserBCEmail = (data: CustomFieldItems) =>
  B3Request.graphqlB2B({
    query: checkCustomerBCEmail(data),
  }).then((res) => ({
    ...res.customerEmailCheck,
    isValid: res.customerEmailCheck.userType !== UserTypes.B2C,
  }));
