import { describe, expect, it } from 'vitest';

import { getOwnedOperation, ownedOperations } from './registry';

describe('owned operation registry', () => {
  it('registers GetCustomerOrders from the Orders mock domain', () => {
    const operation = getOwnedOperation({
      operationName: 'GetCustomerOrders',
      transport: 'sf-proxy',
    });

    expect(operation).toMatchObject({
      operationName: 'GetCustomerOrders',
      transport: 'sf-proxy',
      owner: 'buyer-portal-orders',
      flow: 'my-orders-unified-orders-poc',
    });
  });

  it('registers the same Storefront operation for proxy and direct local transports', () => {
    expect(
      getOwnedOperation({ operationName: 'GetCustomerOrders', transport: 'sf-proxy' }),
    ).toBeDefined();
    expect(
      getOwnedOperation({ operationName: 'GetCustomerOrders', transport: 'sf-direct' }),
    ).toBeDefined();
  });

  it('does not register unrelated operations or unrelated transports', () => {
    expect(
      getOwnedOperation({ operationName: 'GetOrderDetail', transport: 'sf-proxy' }),
    ).toBeUndefined();
    expect(
      getOwnedOperation({ operationName: 'GetCustomerOrders', transport: 'b2b' }),
    ).toBeUndefined();
  });

  it('keeps registry entries unique by operation and transport', () => {
    const keys = ownedOperations.map(
      (operation) => `${operation.transport}:${operation.operationName}`,
    );

    expect(new Set(keys).size).toBe(keys.length);
  });
});
