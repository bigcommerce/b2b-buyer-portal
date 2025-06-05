import B3Request from '@/shared/service/request/b3Fetch';

const toNumberSafely = (value?: number | string): number | undefined =>
  value !== undefined && value !== '' ? Number(value) : undefined;

const updateUserQl = `
  mutation UpdateUser ($userData: UserUpdateInputType!) {
    userUpdate ( userData: $userData ) {
      user {
        id
      }
    }
  }
`;

interface UpdateUserResponse {
  data: { userUpdate: { user: { id: number } } };
}

interface UpdateUserVariables {
  userId: number | string;
  companyId: number | string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  companyRoleId?: number | string;
  addChannel?: boolean;
  companyRoleName?: string;
  extraFields?: { fieldName: string; fieldValue: string }[];
}

export const updateUser = (data: UpdateUserVariables) => {
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

  return B3Request.graphqlB2B<UpdateUserResponse>({ query: updateUserQl, variables: { userData } });
};
