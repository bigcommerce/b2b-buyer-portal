import B3Request from '@/shared/service/request/b3Fetch';
import { UserTypes } from '@/types';
import { convertArrayToGraphql, storeHash } from '@/utils';

const getUsersQl = `
  query GetUsers($first: Int!, $offset: Int!, $q: String, $companyId: Int!, $companyRoleId: Decimal) {
    users (
      first: $first
      search: $q
      offset: $offset
      companyId: $companyId
      companyRoleId: $companyRoleId
    ){
      totalCount,
      pageInfo{
        hasNextPage,
        hasPreviousPage,
      },
      edges{
        node{
          id,
          createdAt,
          updatedAt,
          firstName,
          lastName,
          email,
          phone,
          bcId,
          role,
          uuid,
          extraFields{
            fieldName
            fieldValue
          }
          companyRoleId,
          companyRoleName,
          masqueradingCompanyId,
          companyInfo {
            companyId,
            companyName,
            companyAddress,
            companyCountry,
            companyState,
            companyCity,
            companyZipCode,
            phoneNumber,
            bcId,
          },
        }
      }
    }
  }
`;

const addOrUpdateUsersQl = (data: CustomFieldItems) => `
  mutation ${data?.userId ? 'UpdateUser' : 'CreateUser'} {
    ${data?.userId ? 'userUpdate' : 'userCreate'} (
      userData: {
        companyId: ${data.companyId}
        ${data?.email ? `email: "${data.email}"` : ''}
        firstName: "${data.firstName || ''}"
        lastName: "${data.lastName || ''}"
        phone: "${data.phone || ''}"
        ${data?.companyRoleId ? `companyRoleId: ${data.companyRoleId}` : ''}
        ${data?.userId ? `userId: ${data.userId}` : ''}
        ${data?.addChannel ? `addChannel: ${data.addChannel}` : ''}
        extraFields: ${convertArrayToGraphql(data?.extraFields || [])}
        ${data?.companyRoleName ? `companyRoleName: ${data.companyRoleName}` : ''}
      }
    ){
      user{
        id,
        bcId,
      }
    }
  }
`;

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

export interface GetUsersVariables {
  first: number;
  offset: number;
  q?: string;
  companyId: number | string;
  companyRoleId?: number | string;
}

export const getUsers = (data: GetUsersVariables) =>
  B3Request.graphqlB2B<UsersResponse>({
    query: getUsersQl,
    variables: {
      ...data,
      q: data.q || '',
      companyId: Number(data.companyId),
      companyRoleId:
        data.companyRoleId !== undefined && data.companyRoleId !== ''
          ? Number(data.companyRoleId)
          : undefined,
    },
  });

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

export const addOrUpdateUsers = (data: CustomFieldItems) =>
  B3Request.graphqlB2B({
    query: addOrUpdateUsersQl(data),
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
