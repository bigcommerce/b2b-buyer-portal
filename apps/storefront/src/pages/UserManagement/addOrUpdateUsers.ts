import B3Request from '@/shared/service/request/b3Fetch';
import { convertArrayToGraphql } from '@/utils';

const addOrUpdateUsersQl = (data: CustomFieldItems) => `
  mutation ${data?.userId ? 'UpdateUser' : 'CreateUser'} {
    ${data?.userId ? 'userUpdate' : 'userCreate'} (
      userData: {
        companyId: ${data.companyId}
        ${data?.email ? `email: "${data.email}"` : ''}
        firstName: "${data.firstName || ''}"
        lastName: "${data.lastName || ''}"
        phone: "${data.phone || ''}"
        ${data?.companyRoleId ? `companyRoleId: ${data.companyRoleId}` : ''}
        ${data?.userId ? `userId: ${data.userId}` : ''}
        ${data?.addChannel ? `addChannel: ${data.addChannel}` : ''}
        extraFields: ${convertArrayToGraphql(data?.extraFields || [])}
        ${data?.companyRoleName ? `companyRoleName: ${data.companyRoleName}` : ''}
      }
    ){
      user{
        id,
        bcId,
      }
    }
  }
`;

export const addOrUpdateUsers = (data: CustomFieldItems) =>
  B3Request.graphqlB2B({
    query: addOrUpdateUsersQl(data),
  });
