import { builder, faker } from 'tests/test-utils';

import { OrderStatusItem } from '@/types';

import { findOrderStatus } from './findOrderStatus';

const buildOrderStatusItemWith = builder<OrderStatusItem>(() => ({
  statusCode: faker.number.int().toString(),
  systemLabel: faker.lorem.words(2),
  customLabel: faker.lorem.words(2),
}));

describe('findOrderStatus', () => {
  it('finds a status by its system label', () => {
    const status = buildOrderStatusItemWith('WHATEVER_VALUES');

    expect(
      findOrderStatus([buildOrderStatusItemWith('WHATEVER_VALUES'), status], status.systemLabel),
    ).toBe(status);
  });

  it('falls back to the custom label when no system label matches', () => {
    const status = buildOrderStatusItemWith('WHATEVER_VALUES');

    expect(
      findOrderStatus([buildOrderStatusItemWith('WHATEVER_VALUES'), status], status.customLabel),
    ).toBe(status);
  });

  it('prefers the system label match over an earlier status whose custom label equals it', () => {
    const completed = buildOrderStatusItemWith({ systemLabel: 'Completed', customLabel: 'Done' });
    const shipped = buildOrderStatusItemWith({ systemLabel: 'Shipped', customLabel: 'Completed' });

    expect(findOrderStatus([shipped, completed], 'Completed')).toBe(completed);
  });

  it('returns nothing when no label matches', () => {
    expect(
      findOrderStatus([buildOrderStatusItemWith('WHATEVER_VALUES')], faker.string.uuid()),
    ).toBeUndefined();
  });
});
