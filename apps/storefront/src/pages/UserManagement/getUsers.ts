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
