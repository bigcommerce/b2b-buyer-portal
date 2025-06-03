import B3Request from '@/shared/service/request/b3Fetch';

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
      edges{
        node{
          id,
          firstName,
          lastName,
          email,
          companyRoleName,
          companyInfo {
            companyId,
          },
        }
      }
    }
  }
`;

export interface UsersResponse {
  data: {
    users: {
      totalCount: number;
      edges: Array<{
        node: {
          id: string;
          firstName: string;
          lastName: string;
          email: string;
          companyRoleName: string;
          companyInfo: {
            companyId: string;
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
