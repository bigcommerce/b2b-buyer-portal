import {
  B3Request,
} from '../../request/b3Fetch'

import {
  convertArrayToGraphql,
} from '../../../../utils'

const getCustomerAddress = ({
  companyId = 0,
  offset = 0,
  first = 50,
  search = '',
  country = '',
  state = '',
  city = '',
}) => `{
  addresses (
    companyId: ${companyId}
    offset: ${offset}
    first: ${first}
    search: "${search}"
    country: "${country}"
    state: "${state}"
    city: "${city}"
  ){
    totalCount,
    pageInfo{
      hasNextPage,
      hasPreviousPage,
    },
    edges{
      node{
        id
        createdAt
        updatedAt
        firstName
        lastName
        isShipping
        isBilling
        addressLine1
        addressLine2
        address
        city
        state
        stateCode
        country
        countryCode
        zipCode
        phoneNumber
        isActive
        label
        uuid
        extraFields {
          fieldName
          fieldValue
        }
        isDefaultShipping
        isDefaultBilling
      }
    }
  }
}`

const updateAddress = (data: CustomFieldItems) => `mutation{
  addressUpdate(addressData: {
    companyId: ${data.companyId},
    firstName: "${data.firstName}",
    lastName: "${data.lastName}",
    addressLine1: "${data.addressLine1}",
    addressLine2: "${data.addressLine2 || ''}",
    country: "${data.country}",
    countryCode: "${data.countryCode}",
    state: "${data.state}",
    stateCode: "${data.stateCode || ''}",
    city: "${data.city}",
    zipCode: "${data.zipCode}",
    phoneNumber: "${data.phoneNumber}",
    isShipping: ${data.isShipping},
    isBilling: ${data.isBilling},
    isDefaultShipping: ${data.isDefaultShipping},
    isDefaultBilling: ${data.isDefaultBilling},
    label: "${data.label}",
    uuid: "${data.uuid}",
    extraFields: ${convertArrayToGraphql(data.extraFields || [])},
    addressId: ${data.id}
  }) {
    address{
      id
    }
  }
}`

const deleteAddress = (data: CustomFieldItems) => `mutation{
  addressDelete(
    addressId: ${data.addressId},
    companyId: ${data.companyId},
  ) {
    message
  }
}`

export const getB2BCustomerAddress = (data: CustomFieldItems = {}): CustomFieldItems => B3Request.graphqlB2B({
  query: getCustomerAddress(data),
})

export const deleteB2BAddress = (data: CustomFieldItems = {}): CustomFieldItems => B3Request.graphqlB2B({
  query: deleteAddress(data),
})

export const updateB2BAddress = (data: CustomFieldItems = {}): CustomFieldItems => B3Request.graphqlB2B({
  query: updateAddress(data),
})
