import { convertObjectToGraphql } from '../../../../utils';
import B3Request from '../../request/b3Fetch';

const updateAccountSettings = (data: CustomFieldItems) => `mutation{
  updateAccountSettings (
    updateData: ${convertObjectToGraphql(data)}
  ){
    result {
      email
    },
  }
}`;

const updateCustomerAccountSettings = (data: CustomFieldItems) => `mutation{
  updateCustomerAccountSettings (
    updateData: ${convertObjectToGraphql(data)}
  ){
    result {
      email
    },
  }
}`;

const getAccountSettings = (data: CustomFieldItems) => `query GetB2bAccountSettings {
  accountSettings (
    companyId: ${data.companyId}
  ){
    firstName,
    lastName,
    company,
    phoneNumber,
    email,
    formFields {
      name,
      value
    },
    extraFields {
      fieldName,
      fieldValue,
    }
    role,
    companyRoleId,
    companyRoleName,
  }
}`;

const customerAccountSettings = () => `query getB2CAccountSettings {
  customerAccountSettings {
    firstName,
    lastName,
    company,
    phoneNumber,
    email,
    formFields {
      name,
      value
    },
  }
}`;

export const updateB2BAccountSettings = (data: CustomFieldItems) =>
  B3Request.graphqlB2B({
    query: updateAccountSettings(data),
  });

export const updateBCAccountSettings = (data: CustomFieldItems) =>
  B3Request.graphqlB2B({
    query: updateCustomerAccountSettings(data),
  });

export const getB2BAccountSettings = (data: CustomFieldItems) =>
  B3Request.graphqlB2B({
    query: getAccountSettings(data),
  });

export const getBCAccountSettings = () =>
  B3Request.graphqlB2B({
    query: customerAccountSettings(),
  });
