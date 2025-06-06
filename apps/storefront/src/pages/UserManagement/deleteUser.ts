import B3Request from '@/shared/service/request/b3Fetch';

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

export const deleteUsers = (data: CustomFieldItems) =>
  B3Request.graphqlB2B({
    query: deleteUsersQl(data),
  });
