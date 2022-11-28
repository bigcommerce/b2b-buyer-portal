import {
  B3Request,
} from '../../request/b3Fetch'

import {
  storeHash,
} from '../../../../utils/basicConfig'

import {
  convertArrayToGraphql,
} from '../../../../utils'

const getAddressConfig = () => `{
  addressConfig (
    storeHash: "${storeHash}"
  ){
    key
    isEnabled
  }
}`

const getAddress = ({
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

const getCustomerAddress = ({
  offset = 0,
  first = 50,
  search = '',
  country = '',
  state = '',
  city = '',
}) => `{
  customerAddresses (
    offset: ${offset}
    first: ${first}
    search: "${search}"
    country: "${country}"
    stateOrProvince: "${state}"
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
        company
        bcAddressId
        address1
        address2
        city
        stateOrProvince
        postalCode
        country
        countryCode
        phone
        addressType
        formFields{
          name
          value
          addressId
        }
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

const deleteCustomerAddress = (data: CustomFieldItems) => `mutation{
  customerAddressDelete(
    bcAddressId: ${data.bcAddressId},
  ) {
    message
  }
}`

export const getB2BAddress = (data: CustomFieldItems = {}): CustomFieldItems => B3Request.graphqlB2B({
  query: getAddress(data),
})

export const getB2BAddressConfig = (): CustomFieldItems => B3Request.graphqlB2B({
  query: getAddressConfig(),
})

export const getBCCustomerAddress = (data: CustomFieldItems = {}): CustomFieldItems => B3Request.graphqlProxyBC({
  query: getCustomerAddress(data),
})

export const deleteB2BAddress = (data: CustomFieldItems = {}): CustomFieldItems => B3Request.graphqlB2B({
  query: deleteAddress(data),
})

export const deleteBCCustomerAddress = (data: CustomFieldItems = {}): CustomFieldItems => B3Request.graphqlProxyBC({
  query: deleteCustomerAddress(data),
})

export const updateB2BAddress = (data: CustomFieldItems = {}): CustomFieldItems => B3Request.graphqlB2B({
  query: updateAddress(data),
})
