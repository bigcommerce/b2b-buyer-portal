import { builder } from 'tests/test-utils';

import type { Currency } from '@/types';

import {
  buildLegacyOrderListMoneyString,
  buildMoneyFormat,
  DEFAULT_MONEY_FORMAT,
} from './buildMoneyFormat';

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

describe('buildMoneyFormat', () => {
  it('returns USD defaults when the currency code is not in the store', () => {
    expect(buildMoneyFormat([], 'EUR')).toEqual(DEFAULT_MONEY_FORMAT);
  });

  it('maps store currency fields to MoneyFormat', () => {
    const euro = buildCurrencyWith({
      currency_code: 'EUR',
      token: '€',
      decimal_token: ',',
      thousands_token: '.',
      currency_exchange_rate: '0.85',
    });

    expect(buildMoneyFormat([euro], 'EUR')).toEqual({
      currency_location: 'left',
      currency_token: '€',
      decimal_token: ',',
      decimal_places: 2,
      thousands_token: '.',
      currency_exchange_rate: '0.85',
    });
  });
});

describe('buildLegacyOrderListMoneyString', () => {
  it('double-encodes MoneyFormat for the legacy order list wire format', () => {
    const usd = buildCurrencyWith('WHATEVER_VALUES');
    const encoded = buildLegacyOrderListMoneyString([usd], 'USD');

    expect(JSON.parse(JSON.parse(encoded))).toEqual(buildMoneyFormat([usd], 'USD'));
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
