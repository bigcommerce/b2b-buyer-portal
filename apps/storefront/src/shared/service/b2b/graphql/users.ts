import { UserTypes } from '@/types';

import { convertArrayToGraphql, storeHash } from '../../../../utils';
import B3Request from '../../request/b3Fetch';

const getUsersQl = (data: CustomFieldItems) => `{
  users (
    first: ${data.first}
    search: "${data.q || ''}"
    offset: ${data.offset}
    companyId: ${data.companyId}
    ${data.companyRoleId === '' ? '' : `companyRoleId: ${data.companyRoleId}`}
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
}`;

const addOrUpdateUsersQl = (data: CustomFieldItems) => `mutation{
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
}`;

const deleteUsersQl = (data: CustomFieldItems) => `mutation{
  userDelete (
    companyId: ${data.companyId}
    userId: ${data.userId}
  ){
    message
  }
}`;

const checkUserB2BEmail = (data: CustomFieldItems) => `{
  userEmailCheck (
    email: "${data.email}"
    companyId: ${data.companyId || null}
    storeHash: "${storeHash}"
    channelId: ${data.channelId || null}
  ){
    userType,
    userInfo{
      id
      email
      firstName
      lastName
      phoneNumber
      role
      companyName
      originChannelId
      forcePasswordReset
    }
  }
}`;

const checkCustomerBCEmail = (data: CustomFieldItems) => `{
  customerEmailCheck (
    email: "${data.email}"
    storeHash: "${storeHash}"
    channelId: ${data.channelId || null}
  ){
    userType,
  }
}`;

const getUserExtraFields = () => `{
  userExtraFields {
    fieldName
    fieldType
    isRequired
    defaultValue
    maximumLength
    numberOfRows
    maximumValue
    listOfValue
    visibleToEnduser
    labelName
  }
}`;

export const getUsers = (data: CustomFieldItems) =>
  B3Request.graphqlB2B({
    query: getUsersQl(data),
  });

export const getUsersExtraFieldsInfo = () =>
  B3Request.graphqlB2B({
    query: getUserExtraFields(),
  });

export const addOrUpdateUsers = (data: CustomFieldItems) =>
  B3Request.graphqlB2B({
    query: addOrUpdateUsersQl(data),
  });

export const deleteUsers = (data: CustomFieldItems) =>
  B3Request.graphqlB2B({
    query: deleteUsersQl(data),
  });

export const checkUserEmail = (data: CustomFieldItems) =>
  B3Request.graphqlB2B({
    query: checkUserB2BEmail(data),
  }).then((res) => ({
    ...res.userEmailCheck,
    isValid: res.userEmailCheck.userType === UserTypes.DOES_NOT_EXIST,
  }));

export const checkUserBCEmail = (data: CustomFieldItems) =>
  B3Request.graphqlB2B({
    query: checkCustomerBCEmail(data),
  }).then((res) => ({
    ...res.customerEmailCheck,
    isValid: res.customerEmailCheck.userType !== UserTypes.B2C,
  }));
