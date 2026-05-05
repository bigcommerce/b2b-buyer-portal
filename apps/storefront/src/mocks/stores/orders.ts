import type { DateTimeExtended, Money, Order } from '@/shared/service/bc/graphql/orders';

type OrderOverride = Partial<Order> & Pick<Order, 'entityId'>;

const ordersById = new Map<number, Order>();

function money(value: number, currencyCode = 'USD'): Money {
  return { currencyCode, value };
}

function dateTime(utc: string): DateTimeExtended {
  return { utc };
}

export function mockOrderFactory(overrides: OrderOverride): Order {
  const { entityId } = overrides;
  const orderedAt = overrides.orderedAt ?? dateTime('2026-05-04T10:00:00.000Z');

  return {
    entityId,
    orderedAt,
    updatedAt: overrides.updatedAt ?? orderedAt,
    status: overrides.status ?? { value: 'AWAITING_FULFILLMENT', label: 'Awaiting Fulfillment' },
    billingAddress: overrides.billingAddress ?? {
      firstName: 'Avery',
      lastName: 'Buyer',
      company: 'Acme Manufacturing',
      address1: '1 Mock Street',
      address2: null,
      city: 'Austin',
      stateOrProvince: 'TX',
      postalCode: '78701',
      country: 'United States',
      countryCode: 'US',
      phone: '555-0100',
      email: 'avery@example.com',
    },
    subTotal: overrides.subTotal ?? money(100),
    discountedSubTotal:
      overrides.discountedSubTotal === undefined ? money(95) : overrides.discountedSubTotal,
    shippingCostTotal: overrides.shippingCostTotal ?? money(10),
    handlingCostTotal: overrides.handlingCostTotal ?? money(0),
    wrappingCostTotal: overrides.wrappingCostTotal ?? money(0),
    taxTotal: overrides.taxTotal ?? money(8),
    totalIncTax: overrides.totalIncTax ?? money(113),
    isTaxIncluded: overrides.isTaxIncluded ?? false,
    taxes: overrides.taxes ?? [{ name: 'Sales Tax', amount: money(8) }],
    discounts: overrides.discounts ?? {
      couponDiscounts: [],
      nonCouponDiscountTotal: money(5),
      totalDiscount: money(5),
    },
    customerMessage: overrides.customerMessage === undefined ? null : overrides.customerMessage,
    totalProductQuantity: overrides.totalProductQuantity ?? 2,
    consignments: overrides.consignments === undefined ? null : overrides.consignments,
    reference: overrides.reference === undefined ? `PO-${entityId}` : overrides.reference,
    company:
      overrides.company === undefined
        ? { entityId: 501, name: 'Acme Manufacturing' }
        : overrides.company,
    placedBy:
      overrides.placedBy === undefined
        ? {
            entityId: 701,
            firstName: 'Avery',
            lastName: 'Buyer',
            email: 'avery@example.com',
          }
        : overrides.placedBy,
    history: overrides.history ?? [],
    quote: overrides.quote === undefined ? null : overrides.quote,
    invoice: overrides.invoice === undefined ? null : overrides.invoice,
    extraFields: overrides.extraFields ?? [],
  };
}

function setOrders(orders: Order[]): void {
  ordersById.clear();
  orders.forEach((order) => ordersById.set(order.entityId, order));
}

export function seed(): void {
  setOrders([
    mockOrderFactory({
      entityId: 1004,
      orderedAt: dateTime('2026-05-04T14:00:00.000Z'),
      totalIncTax: money(410.25),
      status: { value: 'AWAITING_FULFILLMENT', label: 'Awaiting Fulfillment' },
      reference: 'PO-1004',
    }),
    mockOrderFactory({
      entityId: 1003,
      orderedAt: dateTime('2026-05-03T14:00:00.000Z'),
      totalIncTax: money(250),
      status: { value: 'SHIPPED', label: 'Shipped' },
      reference: 'REF-ACME-003',
    }),
    mockOrderFactory({
      entityId: 1002,
      orderedAt: dateTime('2026-05-02T14:00:00.000Z'),
      totalIncTax: money(99.99),
      status: { value: 'CANCELLED', label: 'Cancelled' },
      reference: 'PO-1002',
    }),
    mockOrderFactory({
      entityId: 1001,
      orderedAt: dateTime('2026-05-01T14:00:00.000Z'),
      totalIncTax: money(35.5),
      status: { value: 'COMPLETED', label: 'Completed' },
      reference: null,
      company: null,
      placedBy: null,
    }),
  ]);
}

export function getOrders(): Order[] {
  return Array.from(ordersById.values());
}

export function reset(): void {
  ordersById.clear();
}

seed();
