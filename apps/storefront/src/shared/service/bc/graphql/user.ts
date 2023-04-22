import B3Request from '../../request/b3Fetch'

const getCustomer = () => `query customer {
  customer{
    entityId,
    phone,
    firstName,
    lastName,
    email,
    customerGroupId,
  }
}`

const getCustomerInfo = (): CustomFieldItems =>
  B3Request.graphqlBC({
    query: getCustomer(),
  })

export default getCustomerInfo
