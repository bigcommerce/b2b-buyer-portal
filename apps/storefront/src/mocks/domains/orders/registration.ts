import { defineGraphQLMock } from '../../defineGraphQLMock';
import { executeGetCustomerOrders } from '../../resolvers/orders';

export const ordersMockOperations = [
  ...defineGraphQLMock({
    operationName: 'GetCustomerOrders',
    owner: 'buyer-portal-orders',
    flow: 'my-orders-unified-orders-poc',
    transports: ['sf-proxy', 'sf-direct'],
    execute: executeGetCustomerOrders,
  }),
];
