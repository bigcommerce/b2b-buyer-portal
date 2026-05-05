import { beforeEach, describe, expect, it } from 'vitest';

import { getOrders, mockOrderFactory, reset, seed } from './orders';

describe('mock order store', () => {
  beforeEach(() => {
    reset();
  });

  it('seeds deterministic B2B and B2C-shaped orders', () => {
    seed();

    const orders = getOrders();

    expect(orders).toHaveLength(4);
    expect(orders[0]).toMatchObject({
      entityId: 1004,
      reference: 'PO-1004',
      company: { entityId: 501, name: 'Acme Manufacturing' },
      placedBy: { firstName: 'Avery', lastName: 'Buyer' },
    });
    expect(orders[3]).toMatchObject({
      entityId: 1001,
      reference: null,
      company: null,
      placedBy: null,
    });
  });

  it('factory accepts explicit overrides', () => {
    const order = mockOrderFactory({
      entityId: 9001,
      status: { value: 'SHIPPED', label: 'Shipped' },
      reference: 'PO-9001',
    });

    expect(order.entityId).toBe(9001);
    expect(order.status.label).toBe('Shipped');
    expect(order.reference).toBe('PO-9001');
  });

  it('reset clears seeded state', () => {
    seed();
    reset();

    expect(getOrders()).toEqual([]);
  });
});
