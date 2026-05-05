import { describe, expect, it } from 'vitest';

import { OrdersSortInput } from '@/shared/service/bc/graphql/orders';

import {
  mapFilterDataToUnifiedVariables,
  mapLegacyOrderByToUnifiedSort,
  mapUnifiedOrdersResponseToLegacyList,
} from './unifiedOrdersAdapter';

describe('unifiedOrdersAdapter', () => {
  it('maps unified response rows into existing My Orders list item shape', () => {
    const result = mapUnifiedOrdersResponseToLegacyList({
      data: {
        customer: {
          orders: {
            edges: [
              {
                cursor: '1004',
                node: {
                  entityId: 1004,
                  orderedAt: { utc: '2026-05-04T14:00:00.000Z' },
                  totalIncTax: { currencyCode: 'USD', value: 410.25 },
                  status: { value: 'AWAITING_FULFILLMENT', label: 'Awaiting Fulfillment' },
                  reference: 'PO-1004',
                  company: { entityId: 501, name: 'Acme Manufacturing' },
                  placedBy: {
                    entityId: 701,
                    firstName: 'Avery',
                    lastName: 'Buyer',
                    email: 'avery@example.com',
                  },
                },
              },
            ],
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: '1004',
              endCursor: '1004',
            },
          },
        },
      },
    });

    expect(result).toEqual({
      totalCount: 1,
      edges: [
        {
          orderId: '1004',
          poNumber: 'PO-1004',
          totalIncTax: '410.25',
          money: JSON.stringify({
            currency_token: '$',
            currency_location: 'left',
            decimal_places: 2,
          }),
          status: 'Awaiting Fulfillment',
          createdAt: '1777903200',
          firstName: 'Avery',
          lastName: 'Buyer',
          companyName: 'Acme Manufacturing',
        },
      ],
    });
  });

  it('maps null B2C fields safely', () => {
    const result = mapUnifiedOrdersResponseToLegacyList({
      data: {
        customer: {
          orders: {
            edges: [
              {
                cursor: '1001',
                node: {
                  entityId: 1001,
                  orderedAt: { utc: '2026-05-01T14:00:00.000Z' },
                  totalIncTax: { currencyCode: 'USD', value: 35.5 },
                  status: { value: 'COMPLETED', label: 'Completed' },
                  reference: null,
                  company: null,
                  placedBy: null,
                },
              },
            ],
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: '1001',
              endCursor: '1001',
            },
          },
        },
      },
    });

    expect(result.edges[0]).toMatchObject({
      orderId: '1001',
      poNumber: '',
      firstName: '',
      lastName: '',
      companyName: '',
    });
  });

  it('maps supported legacy sort keys to unified sort enum values', () => {
    expect(mapLegacyOrderByToUnifiedSort('-createdAt')).toBe(OrdersSortInput.CREATED_AT_NEWEST);
    expect(mapLegacyOrderByToUnifiedSort('createdAt')).toBe(OrdersSortInput.CREATED_AT_OLDEST);
    expect(mapLegacyOrderByToUnifiedSort('-bcOrderId')).toBe(OrdersSortInput.ID_Z_TO_A);
    expect(mapLegacyOrderByToUnifiedSort('bcOrderId')).toBe(OrdersSortInput.ID_A_TO_Z);
    expect(mapLegacyOrderByToUnifiedSort('-poNumber')).toBe(OrdersSortInput.REFERENCE_Z_TO_A);
  });

  it('maps existing filter state to unified variables', () => {
    expect(
      mapFilterDataToUnifiedVariables({
        q: 'PO-1004',
        orderStatus: 'Shipped',
        orderBy: '-createdAt',
        first: 10,
      }),
    ).toEqual({
      filters: { search: 'PO-1004', status: 'Shipped' },
      sortBy: OrdersSortInput.CREATED_AT_NEWEST,
      first: 10,
    });
  });

  it('maps Order.tsx statusCode filter state to unified variables', () => {
    expect(
      mapFilterDataToUnifiedVariables({
        statusCode: 'Shipped',
      }),
    ).toMatchObject({
      filters: { status: 'Shipped' },
    });
  });
});
