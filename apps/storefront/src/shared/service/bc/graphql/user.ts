import B3Request from '../../request/b3Fetch';

const getCustomer = () => `query customer {
  customer{
    entityId,
    phone,
    firstName,
    lastName,
    email,
    customerGroupId,
  }
}`;

const getCustomerInfo = () =>
  B3Request.graphqlBCProxy({
    query: getCustomer(),
  });

export { getCustomerInfo };
