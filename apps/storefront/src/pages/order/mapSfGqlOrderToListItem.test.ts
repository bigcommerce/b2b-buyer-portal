import { describe, expect, it } from 'vitest';

import type { Order } from '@/shared/service/bc/graphql/orders';
import type { Currency } from '@/types';

import { mapSfGqlOrderToListItem } from './mapSfGqlOrderToListItem';

/**
 * Two-currency store config (USD + AUD) for mapper tests — the order's transaction
 * currency may differ from the shopper's active session currency.
 */
function buildTestCurrencies(): Currency[] {
  return [
    {
      id: '1',
      is_default: true,
      currency_code: 'USD',
      token: '$',
      token_location: 'left',
      decimal_places: 2,
      decimal_token: '.',
      thousands_token: ',',
      currency_exchange_rate: '1.0000000000',
      name: 'United States Dollar',
      auto_update: false,
      enabled: true,
      is_transactional: true,
      last_updated: '',
      country_iso2: 'US',
      default_for_country_codes: ['USD'],
    },
    {
      id: '2',
      is_default: false,
      currency_code: 'AUD',
      token: 'A$',
      token_location: 'left',
      decimal_places: 2,
      decimal_token: '.',
      thousands_token: ',',
      currency_exchange_rate: '1.5000000000',
      name: 'Australian Dollar',
      auto_update: false,
      enabled: true,
      is_transactional: true,
      last_updated: '',
      country_iso2: 'AU',
      default_for_country_codes: ['AUD'],
    },
  ];
}

// Minimal SF GQL Order fixture — only the fields mapSfGqlOrderToListItem reads.
function buildOrder(overrides: Partial<Order> = {}): Order {
  return {
    entityId: 12345,
    orderedAt: { utc: '2026-01-15T10:00:00.000Z' },
    updatedAt: { utc: '2026-01-15T10:00:00.000Z' },
    status: { value: 'PENDING', label: 'Pending' },
    reference: 'PO-001',
    totalIncTax: { currencyCode: 'USD', value: 90 },
    placedBy: { entityId: 1, firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com' },
    company: null,
    ...overrides,
  } as unknown as Order;
}

describe('mapSfGqlOrderToListItem', () => {
  const currencies = buildTestCurrencies();

  describe('money field — currency formatting', () => {
    it('sets money to a non-empty string so the order-specific currency is used for display', () => {
      const result = mapSfGqlOrderToListItem(buildOrder(), currencies);
      expect(result.money).not.toBe('');
    });

    it('encodes the order currency token (USD "$") not the session currency token (AUD "A$")', () => {
      const result = mapSfGqlOrderToListItem(
        buildOrder({ totalIncTax: { currencyCode: 'USD', value: 90 } }),
        currencies,
      );

      // money is double-JSON-stringified to match how Order.tsx consumes it:
      //   ordersCurrencyFormat(JSON.parse(JSON.parse(money)), totalIncTax)
      const moneyFormat = JSON.parse(JSON.parse(result.money as string));
      expect(moneyFormat.currency_token).toBe('$');
      expect(moneyFormat.currency_token).not.toBe('A$');
    });

    it('encodes the AUD token when the order was placed in AUD', () => {
      const result = mapSfGqlOrderToListItem(
        buildOrder({ totalIncTax: { currencyCode: 'AUD', value: 135 } }),
        currencies,
      );

      const moneyFormat = JSON.parse(JSON.parse(result.money as string));
      expect(moneyFormat.currency_token).toBe('A$');
    });
  });

  describe('other fields', () => {
    it('maps orderId from entityId', () => {
      const result = mapSfGqlOrderToListItem(buildOrder({ entityId: 99 }), currencies);
      expect(result.orderId).toBe('99');
    });

    it('maps poNumber from reference', () => {
      const result = mapSfGqlOrderToListItem(buildOrder({ reference: 'REF-42' }), currencies);
      expect(result.poNumber).toBe('REF-42');
    });

    it('maps totalIncTax value as a string', () => {
      const result = mapSfGqlOrderToListItem(
        buildOrder({ totalIncTax: { currencyCode: 'USD', value: 90 } }),
        currencies,
      );
      expect(result.totalIncTax).toBe('90');
    });

    it('maps status label', () => {
      const result = mapSfGqlOrderToListItem(
        buildOrder({ status: { value: 'COMPLETED', label: 'Completed' } }),
        currencies,
      );
      expect(result.status).toBe('Completed');
    });

    it('passes the cursor through', () => {
      const result = mapSfGqlOrderToListItem(buildOrder(), currencies, 'cursor-abc');
      expect(result.cursor).toBe('cursor-abc');
    });

    it('leaves cursor undefined when not provided', () => {
      const result = mapSfGqlOrderToListItem(buildOrder(), currencies);
      expect(result.cursor).toBeUndefined();
    });
  });
});
