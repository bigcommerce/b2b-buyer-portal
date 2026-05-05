import { afterEach, describe, expect, it } from 'vitest';

import { resolveGraphQLMock } from './handlers';
import { getOwnedOperation } from './registry';

describe('resolveGraphQLMock', () => {
  const customerOrdersOperation = getOwnedOperation({
    operationName: 'GetCustomerOrders',
    transport: 'sf-proxy',
  });
  const originalExecute = customerOrdersOperation?.execute;

  afterEach(() => {
    if (customerOrdersOperation && originalExecute) {
      customerOrdersOperation.execute = originalExecute;
    }
  });

  it('returns mocked JSON for registered operations', async () => {
    const result = await resolveGraphQLMock({
      operationName: 'GetCustomerOrders',
      transport: 'sf-proxy',
      variables: { first: 1 },
    });

    expect(result.kind).toBe('mocked');
    if (result.kind === 'mocked') {
      expect(result.body).toMatchObject({
        data: { customer: { orders: { edges: expect.any(Array) } } },
      });
    }
  });

  it('passes through unregistered operations', async () => {
    const result = await resolveGraphQLMock({
      operationName: 'GetOrderDetail',
      transport: 'sf-proxy',
      variables: {},
    });

    expect(result).toEqual({ kind: 'passthrough' });
  });

  it('converts resolver exceptions into GraphQL errors', async () => {
    if (!customerOrdersOperation) {
      throw new Error('Expected GetCustomerOrders to be registered for sf-proxy');
    }

    customerOrdersOperation.execute = async () => {
      throw new Error('Resolver exploded');
    };

    const result = await resolveGraphQLMock({
      operationName: 'GetCustomerOrders',
      transport: 'sf-proxy',
      variables: { first: 1 },
    });

    expect(result.kind).toBe('mocked');
    if (result.kind === 'mocked') {
      expect(result.body).toEqual({
        data: null,
        errors: [{ message: 'Resolver exploded' }],
      });
    }
  });
});
