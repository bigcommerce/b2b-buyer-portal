import B3Request from '@/shared/service/request/b3Fetch';

const toNumberSafely = (value?: number | string): number | undefined =>
  value !== undefined && value !== '' ? Number(value) : undefined;

const addUserQl = `
  mutation CreateUser ($userData: UserInputType!) {
    userCreate ( userData: $userData ){
      user{
        id,
        bcId,
      }
    }
  }
`;

const updateUserQl = `
  mutation UpdateUser ($userData: UserUpdateInputType!) {
    userUpdate ( userData: $userData ){
      user{
        id,
        bcId,
      }
    }
  }
`;

interface AddOrUpdateUsersVariables {
  userId?: number | string;
  companyId?: number | string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  companyRoleId?: number | string;
  addChannel?: boolean;
  companyRoleName?: string;
  extraFields?: { fieldName: string; fieldValue: string }[];
}

export const addOrUpdateUsers = (data: AddOrUpdateUsersVariables) => {
  const userData = {
    userId: toNumberSafely(data.userId),
    companyId: toNumberSafely(data.companyId),
    companyRoleId: toNumberSafely(data.companyRoleId),
    // not simply spreading data as the form is also including extraFields duplicated inline
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone,
    addChannel: data.addChannel,
    companyRoleName: data.companyRoleName,
    extraFields: data.extraFields,
  };

  return B3Request.graphqlB2B({
    query: userData.userId !== undefined ? updateUserQl : addUserQl,
    variables: { userData },
  });
};
