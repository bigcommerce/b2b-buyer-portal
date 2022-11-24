import {
  B3Request,
} from '../../request/b3Fetch'

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

export const getB2BCustomerAddress = (data: CustomFieldItems = {}): CustomFieldItems => B3Request.graphqlB2B({
  query: getCustomerAddress(data),
})
