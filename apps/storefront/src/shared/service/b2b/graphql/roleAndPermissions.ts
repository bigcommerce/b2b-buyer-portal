import B3Request from '../../request/b3Fetch';

const getRoles = (data: CustomFieldItems) => `
  query CompanyRoles {
    companyRoles (
      first: ${data.first}
      offset: ${data.offset}
      search: "${data.search || ''}"
    ) {
      edges {
        node {
          id
          name
          roleLevel
          roleType
        }
      },
      totalCount
      pageInfo{
        hasNextPage,
        hasPreviousPage,
      },
    }
  }
`;

export interface CompanyRolesResponse {
  data: {
    companyRoles: {
      edges: Array<{
        node: {
          id: string;
          name: string;
          roleLevel: number;
          roleType: number;
        };
      }>;
      totalCount: number;
      pageInfo: {
        hasNextPage: boolean;
        hasPreviousPage: boolean;
      };
    };
  };
}

export const getB2BRoleList = (data: CustomFieldItems): CustomFieldItems =>
  B3Request.graphqlB2B({
    query: getRoles(data),
  });
