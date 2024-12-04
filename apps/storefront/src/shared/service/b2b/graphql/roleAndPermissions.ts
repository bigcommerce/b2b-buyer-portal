import B3Request from '../../request/b3Fetch';

interface SubsidiariesParams {
  companyId: number;
  offset: number;
  before: string;
  after: string;
  first: number;
  last: number;
  search: string;
}

const getPermissions = () => `{
  companyPermissions {
    permissions {
      id
      name
      description
      isCustom
      code
    }
  }
}`;

const getRoles = (data: CustomFieldItems) => `{
  companyRoles (
    first: ${data.first}
    offset: ${data.offset}
    search: "${data?.search || ''}"
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
}`;

const getCompanyRoleAndPermissionsDetails = (data: CustomFieldItems) => `{
  companyRole (
    roleId: ${data.roleId}
  ) {
    id
    name
    roleLevel
    roleType
    permissions {
      id
      name
      isCustom
      code
      permissionLevel
    }
  }
}`;

const getSubsidiaries = `query subsidiaries($companyId: Int!, $offset: Int, $before: String, $after: String, $first: Int, $last: Int, $search: String) {
  subsidiaries(
    companyId: $companyId,
    offset: $offset,
    before: $before,
    after: $after,
    first: $first,
    last: $last,
    search: $search
  ) {
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
    edges {
      node {
        companyName
        id
        companyId
      }
      cursor
    }
    totalCount
  }
}`;

export const getB2BPermissions = (): CustomFieldItems =>
  B3Request.graphqlB2B({
    query: getPermissions(),
  });

export const getB2BRoleList = (data: CustomFieldItems): CustomFieldItems =>
  B3Request.graphqlB2B({
    query: getRoles(data),
  }).then((res) => {
    const { companyRoles } = res;
    return {
      ...companyRoles,
    };
  });

export const getB2BCompanyRoleAndPermissionsDetails = (data: CustomFieldItems): CustomFieldItems =>
  B3Request.graphqlB2B({
    query: getCompanyRoleAndPermissionsDetails(data),
  });

export const getB2BSubsidiaries = (data: Partial<SubsidiariesParams>) =>
  B3Request.graphqlB2B({
    query: getSubsidiaries,
    variables: data,
  }).then((res) => {
    const { subsidiaries } = res;

    const newEdges = subsidiaries.edges.map((edge: any) => ({
      ...edge,
      node: {
        ...edge.node,
        id: edge.node.companyId,
        name: edge.node.companyName,
      },
    }));

    return {
      ...subsidiaries,
      edges: newEdges,
    };
  });
