import B3Request from '@/shared/service/request/b3Fetch';

const toNumberSafely = (value?: number | string): number | undefined =>
  value !== undefined && value !== '' ? Number(value) : undefined;

const addUserQl = `
  mutation CreateUser ($userData: UserInputType!) {
    userCreate ( userData: $userData ){
      user {
        id
      }
    }
  }
`;

interface AddUserResponse {
  data: { userCreate: { user: { id: number } } };
}

interface AddUserVariables {
  companyId: number | string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  companyRoleId?: number | string;
  addChannel?: boolean;
  companyRoleName?: string;
  extraFields?: Array<{ fieldName: string; fieldValue: string }>;
}

export const addUser = (data: AddUserVariables) => {
  const userData = {
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

  return B3Request.graphqlB2B<AddUserResponse>({ query: addUserQl, variables: { userData } });
};
