import { builder } from 'tests/test-utils';

import type { Currency } from '@/types';

import {
  buildLegacyOrderListMoneyString,
  DEFAULT_MONEY_FORMAT,
  formatOrderListGrandTotal,
  getMoneyFormatByCurrencyCode,
} from './orderMoneyUtils';

const buildCurrencyWith = builder<Currency>(() => ({
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
}));

describe('getMoneyFormatByCurrencyCode', () => {
  it('returns USD defaults when the currency code is not in the store', () => {
    expect(getMoneyFormatByCurrencyCode([], 'EUR')).toEqual(DEFAULT_MONEY_FORMAT);
  });

  it('maps store currency fields to MoneyFormat', () => {
    const euro = buildCurrencyWith({
      currency_code: 'EUR',
      token: '€',
      decimal_token: ',',
      thousands_token: '.',
      currency_exchange_rate: '0.85',
    });

    expect(getMoneyFormatByCurrencyCode([euro], 'EUR')).toEqual({
      currency_location: 'left',
      currency_token: '€',
      decimal_token: ',',
      decimal_places: 2,
      thousands_token: '.',
      currency_exchange_rate: '0.85',
    });
  });

  it('matches currency codes case-insensitively', () => {
    const euro = buildCurrencyWith({
      currency_code: 'EUR',
      token: '€',
      decimal_token: ',',
      thousands_token: '.',
    });

    expect(getMoneyFormatByCurrencyCode([euro], 'eur').currency_token).toBe('€');
  });
});

describe('buildLegacyOrderListMoneyString', () => {
  it('double-encodes MoneyFormat for the legacy order list wire format', () => {
    const usd = buildCurrencyWith('WHATEVER_VALUES');
    const encoded = buildLegacyOrderListMoneyString([usd], 'USD');

    expect(JSON.parse(JSON.parse(encoded))).toEqual(getMoneyFormatByCurrencyCode([usd], 'USD'));
  });

  it('encodes the order currency token, not a different code in the list', () => {
    const usd = buildCurrencyWith({ currency_code: 'USD', token: '$' });
    const aud = buildCurrencyWith({
      id: '2',
      currency_code: 'AUD',
      token: 'A$',
      currency_exchange_rate: '1.5000000000',
    });

    const encoded = buildLegacyOrderListMoneyString([usd, aud], 'AUD');
    const moneyFormat = JSON.parse(JSON.parse(encoded));

    expect(moneyFormat.currency_token).toBe('A$');
    expect(moneyFormat.currency_token).not.toBe('$');
  });
});

describe('formatOrderListGrandTotal', () => {
  it('formats using the order money field when present', () => {
    const money = buildLegacyOrderListMoneyString(
      [
        buildCurrencyWith({
          currency_code: 'EUR',
          token: '€',
          decimal_token: ',',
          thousands_token: '.',
        }),
      ],
      'EUR',
    );

    expect(formatOrderListGrandTotal(1000, money)).toBe('€1.000,00');
  });

  it('falls back to session currency formatting when money is absent', () => {
    expect(formatOrderListGrandTotal(1000)).toMatch(/\$1,000\.00/);
  });
});
