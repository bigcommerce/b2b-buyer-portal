import { describe, expect, it } from 'vitest';

import { getOwnedOperation, ownedOperations } from './registry';

describe('owned operation registry', () => {
  it('registers GetCustomerOrders for the narrow unified-orders Storefront proxy flow', () => {
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

  it('also registers local direct dev proxy transport for My Orders only', () => {
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
