import { convertObjectToGraphql } from '../../../../utils'
import B3Request from '../../request/b3Fetch'

const updateAccountSettings = (data: CustomFieldItems) => `mutation{
  updateAccountSettings (
    updateData: ${convertObjectToGraphql(data)}
  ){
    result {
      email
    },
  }
}`

const updateCustomerAccountSettings = (data: CustomFieldItems) => `mutation{
  updateCustomerAccountSettings (
    updateData: ${convertObjectToGraphql(data)}
  ){
    result {
      email
    },
  }
}`

const getAccountSettings = (data: CustomFieldItems) => `{
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
    role,
  }
}`

const customerAccountSettings = () => `{
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
}`

export const updateB2BAccountSettings = (
  data: CustomFieldItems
): CustomFieldItems =>
  B3Request.graphqlB2B({
    query: updateAccountSettings(data),
  })

export const updateBCAccountSettings = (
  data: CustomFieldItems
): CustomFieldItems =>
  B3Request.graphqlB2BWithBCCustomerToken({
    query: updateCustomerAccountSettings(data),
  })

export const getB2BAccountSettings = (
  data: CustomFieldItems
): CustomFieldItems =>
  B3Request.graphqlB2B({
    query: getAccountSettings(data),
  })

export const getBCAccountSettings = (): CustomFieldItems =>
  B3Request.graphqlB2BWithBCCustomerToken({
    query: customerAccountSettings(),
  })
