import B3Request from '../../request/b3Fetch';

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
    companyId: ${data.companyId}
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
        companyInfo
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
    companyId: ${data.companyId}
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

export const getB2BPermissions = (): CustomFieldItems =>
  B3Request.graphqlB2B({
    query: getPermissions(),
  });

export const getB2BRoleList = (data: CustomFieldItems): CustomFieldItems =>
  B3Request.graphqlB2B({
    query: getRoles(data),
  });

export const getB2BCompanyRoleAndPermissionsDetails = (data: CustomFieldItems): CustomFieldItems =>
  B3Request.graphqlB2B({
    query: getCompanyRoleAndPermissionsDetails(data),
  });
