import { describe, expect, it } from 'vitest';

import type { Order as SfGqlOrder } from '@/shared/service/bc/graphql/orders';
import { buildSfGqlMoneyWith } from 'tests/builders/sfGqlMoneyBuilder';

import { mapSfGqlOrderToListItem } from './mapSfGqlOrderToListItem';

const baseOrder: SfGqlOrder = {
  entityId: 90909,
  orderedAt: { utc: '2026-01-01T00:00:00Z' },
  updatedAt: { utc: '2026-01-01T00:00:00Z' },
  status: { value: 'PENDING', label: 'Pending' },
  billingAddress: {
    firstName: null,
    lastName: null,
    company: null,
    address1: null,
    address2: null,
    city: null,
    stateOrProvince: null,
    postalCode: '',
    country: '',
    countryCode: '',
    phone: null,
    email: null,
  },
  subTotal: buildSfGqlMoneyWith({ currencyCode: 'USD', value: 319.95, formattedV2: '$319.95' }),
  discountedSubTotal: null,
  shippingCostTotal: buildSfGqlMoneyWith({ value: 0, formattedV2: '$0.00' }),
  handlingCostTotal: buildSfGqlMoneyWith({ value: 0, formattedV2: '$0.00' }),
  wrappingCostTotal: buildSfGqlMoneyWith({ value: 0, formattedV2: '$0.00' }),
  taxTotal: buildSfGqlMoneyWith({ value: 0, formattedV2: '$0.00' }),
  totalIncTax: buildSfGqlMoneyWith({
    currencyCode: 'USD',
    value: 319.95,
    formattedV2: '319.95$$$',
  }),
  isTaxIncluded: false,
  taxes: [],
  discounts: {
    couponDiscounts: [],
    nonCouponDiscountTotal: buildSfGqlMoneyWith({ value: 0, formattedV2: '$0.00' }),
    totalDiscount: null,
  },
  customerMessage: null,
  totalProductQuantity: 1,
  consignments: null,
  reference: null,
  poNumber: null,
  company: null,
  placedBy: null,
  history: [],
  quote: null,
  invoice: null,
  extraFields: [],
};

describe('mapSfGqlOrderToListItem', () => {
  it('carries the pre-formatted currency string from totalIncTax.formattedV2', () => {
    const item = mapSfGqlOrderToListItem(baseOrder);

    expect(item.formattedTotalIncTax).toBe('319.95$$$');
    expect(item.totalIncTax).toBe('319.95');
  });

  it('passes through the cursor when provided', () => {
    const item = mapSfGqlOrderToListItem(baseOrder, 'cursor-abc');

    expect(item.cursor).toBe('cursor-abc');
  });
});
