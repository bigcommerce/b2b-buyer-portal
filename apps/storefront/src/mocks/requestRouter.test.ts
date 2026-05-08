import { afterEach, describe, expect, it } from 'vitest';

import { getOwnedOperation } from './registry';
import { extractOperationName, resolveB3GraphQLMockRequest } from './requestRouter';

describe('extractOperationName', () => {
  it('extracts a named query operation', () => {
    expect(extractOperationName('query GetCustomerOrders { customer { entityId } }')).toBe(
      'GetCustomerOrders',
    );
  });

  it('returns undefined for anonymous or malformed operations', () => {
    expect(extractOperationName('query { customer { entityId } }')).toBeUndefined();
    expect(extractOperationName('not graphql')).toBeUndefined();
  });
});

describe('resolveB3GraphQLMockRequest', () => {
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

  it('returns mocked GraphQL envelopes for registered operation and transport pairs', async () => {
    const result = await resolveB3GraphQLMockRequest({
      transport: 'sf-proxy',
      request: {
        query:
          'query GetCustomerOrders($first: Int) { customer { orders(first: $first) { edges { node { entityId } } } } }',
        variables: { first: 1 },
      },
    });

    expect(result.kind).toBe('mocked');
    if (result.kind === 'mocked') {
      expect(result.body).toMatchObject({
        data: { customer: { orders: { edges: expect.any(Array) } } },
      });
    }
  });

  it('preserves GraphQL-like resolver bodies', async () => {
    if (!customerOrdersOperation) {
      throw new Error('Expected GetCustomerOrders to be registered for sf-proxy');
    }

    const graphQLBody = {
      data: { customer: { id: 'customer-1' } },
      extensions: { traceId: 'abc' },
    };

    customerOrdersOperation.execute = async () => graphQLBody;

    const result = await resolveB3GraphQLMockRequest({
      transport: 'sf-proxy',
      request: {
        query: 'query GetCustomerOrders { customer { orders { edges { node { entityId } } } } }',
      },
    });

    expect(result).toEqual({ kind: 'mocked', body: graphQLBody });
  });

  it('passes through unregistered operations', async () => {
    await expect(
      resolveB3GraphQLMockRequest({
        transport: 'sf-proxy',
        request: { query: 'query GetOrderDetail { site { order { entityId } } }' },
      }),
    ).resolves.toEqual({ kind: 'passthrough' });
  });

  it('passes through anonymous operations', async () => {
    await expect(
      resolveB3GraphQLMockRequest({
        transport: 'sf-proxy',
        request: { query: 'query { customer { entityId } }' },
      }),
    ).resolves.toEqual({ kind: 'passthrough' });
  });

  it('passes through malformed operations', async () => {
    await expect(
      resolveB3GraphQLMockRequest({
        transport: 'sf-proxy',
        request: { query: 'query GetCustomerOrders {' },
      }),
    ).resolves.toEqual({ kind: 'passthrough' });
  });

  it('converts registered resolver exceptions into GraphQL error envelopes', async () => {
    if (!customerOrdersOperation) {
      throw new Error('Expected GetCustomerOrders to be registered for sf-proxy');
    }

    customerOrdersOperation.execute = async () => {
      throw new Error('Resolver exploded');
    };

    const result = await resolveB3GraphQLMockRequest({
      transport: 'sf-proxy',
      request: {
        query: 'query GetCustomerOrders { customer { orders { edges { node { entityId } } } } }',
      },
    });

    expect(result).toEqual({
      kind: 'mocked',
      body: { data: null, errors: [{ message: 'Resolver exploded' }] },
    });
  });
});
