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
  B3Request.graphqlBCProxy({
    query: getCustomer(),
  })

const customerExists = (): CustomFieldItems =>
  B3Request.graphqlBCProxy({
    query: getCustomer(),
  })

export { customerExists, getCustomerInfo }

// export default getCustomerInfo
