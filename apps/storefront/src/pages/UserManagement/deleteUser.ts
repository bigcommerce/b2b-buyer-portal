import B3Request from '@/shared/service/request/b3Fetch';

const toNumberSafely = (value?: number | string): number | undefined =>
  value !== undefined && value !== '' ? Number(value) : undefined;

const deleteUserQl = `
  mutation DeleteUser ($companyId: Int!, $userId: Int!) { 
    userDelete ( companyId: $companyId, userId: $userId ) {
      message
    }
  }
`;

interface DeleteUserResponse {
  data: { userDelete: { message: string } };
}

interface DeleteUserVariables {
  companyId: number | string;
  userId: number | string;
}

export const deleteUser = (variables: DeleteUserVariables) =>
  B3Request.graphqlB2B<DeleteUserResponse>(
    {
      query: deleteUserQl,
      variables: {
        companyId: toNumberSafely(variables.companyId),
        userId: toNumberSafely(variables.userId),
      },
    },
    true,
  );
