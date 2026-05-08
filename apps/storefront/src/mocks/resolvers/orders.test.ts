import { beforeEach, describe, expect, it } from 'vitest';

import * as orderStore from '../stores/orders';

import { executeGetCustomerOrders } from './orders';

async function executeWithUnknownVariables(variables: unknown) {
  if (!variables || typeof variables !== 'object' || Array.isArray(variables)) {
    return executeGetCustomerOrders({});
  }

  return executeGetCustomerOrders({ variables });
}

describe('executeGetCustomerOrders', () => {
  beforeEach(() => {
    orderStore.reset();
    orderStore.seed();
  });

  it('returns unified customer orders in Storefront GraphQL shape', async () => {
    const result = await executeGetCustomerOrders({ variables: { first: 2 } });

    expect(result.data.customer.orders.edges).toHaveLength(2);
    expect(result.data.customer.orders.edges[0].node).toMatchObject({
      entityId: 1004,
      reference: 'PO-1004',
      company: { name: 'Acme Manufacturing' },
      placedBy: { firstName: 'Avery', lastName: 'Buyer' },
    });
    expect(result.data.customer.orders.pageInfo).toMatchObject({
      hasNextPage: true,
      hasPreviousPage: false,
    });
  });

  it('keeps null-safe B2C-shaped rows', async () => {
    const result = await executeGetCustomerOrders({ variables: { filters: { search: '1001' } } });

    expect(result.data.customer.orders.edges[0].node).toMatchObject({
      entityId: 1001,
      reference: null,
      company: null,
      placedBy: null,
    });
  });

  it('filters by status', async () => {
    const result = await executeGetCustomerOrders({
      variables: { filters: { status: 'SHIPPED' } },
    });

    expect(result.data.customer.orders.edges.map((edge) => edge.node.entityId)).toEqual([1003]);
  });

  it('searches by order ID and reference', async () => {
    const byId = await executeGetCustomerOrders({ variables: { filters: { search: '1002' } } });
    const byReference = await executeGetCustomerOrders({
      variables: { filters: { search: 'REF-ACME' } },
    });

    expect(byId.data.customer.orders.edges.map((edge) => edge.node.entityId)).toEqual([1002]);
    expect(byReference.data.customer.orders.edges.map((edge) => edge.node.entityId)).toEqual([
      1003,
    ]);
  });

  it('ignores malformed filter values instead of throwing', async () => {
    const result = await executeWithUnknownVariables({
      filters: {
        search: 1001,
        status: { value: 'SHIPPED' },
      },
    });

    expect(result.data.customer.orders.edges.map((edge) => edge.node.entityId)).toEqual([
      1004, 1003, 1002, 1001,
    ]);
  });

  it('treats array-shaped variables as malformed', async () => {
    const result = await executeWithUnknownVariables([{ filters: { search: '1001' } }]);

    expect(result.data.customer.orders.edges.map((edge) => edge.node.entityId)).toEqual([
      1004, 1003, 1002, 1001,
    ]);
  });

  it('sorts by created date', async () => {
    const oldest = await executeGetCustomerOrders({ variables: { sortBy: 'CREATED_AT_OLDEST' } });
    const newest = await executeGetCustomerOrders({ variables: { sortBy: 'CREATED_AT_NEWEST' } });

    expect(oldest.data.customer.orders.edges.map((edge) => edge.node.entityId)).toEqual([
      1001, 1002, 1003, 1004,
    ]);
    expect(newest.data.customer.orders.edges.map((edge) => edge.node.entityId)).toEqual([
      1004, 1003, 1002, 1001,
    ]);
  });
});
