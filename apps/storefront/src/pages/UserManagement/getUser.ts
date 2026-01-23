import B3Request from '@/shared/service/request/b3Fetch';

const getUserQl = `
  query GetUser($userId: Int!, $companyId: Int!) {
    user ( userId: $userId companyId: $companyId ) { 
        firstName,
        lastName,
        email,
        phone,
        companyRoleId,
        companyRoleName,
        extraFields {
          fieldName
          fieldValue
        }
      }
    }
`;

export interface UserResponse {
  data: {
    user: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      companyRoleId: number;
      companyRoleName?: string;
      extraFields: Array<{ fieldName: string; fieldValue: string }>;
    };
  };
}

interface GetUserVariables {
  userId: string;
  companyId: string;
}

export const getUser = ({ userId, companyId }: GetUserVariables) =>
  B3Request.graphqlB2B<UserResponse>({
    query: getUserQl,
    variables: { userId: Number(userId), companyId: Number(companyId) },
  }).then(({ user }) => user);
