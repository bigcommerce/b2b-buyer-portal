import type { Currency, MoneyFormat } from '@/types';
import { currencyFormat, ordersCurrencyFormat } from '@/utils/b3CurrencyFormat';

export const DEFAULT_MONEY_FORMAT: MoneyFormat = {
  currency_location: 'left',
  currency_token: '$',
  decimal_token: '.',
  decimal_places: 2,
  thousands_token: ',',
  currency_exchange_rate: '1.0000000000',
};

export function buildMoneyFormat(currencies: Currency[], currencyCode: string): MoneyFormat {
  const currency = currencies.find((c) => c.currency_code === currencyCode);

  if (!currency) {
    return DEFAULT_MONEY_FORMAT;
  }

  return {
    currency_location: currency.token_location,
    currency_token: currency.token,
    decimal_token: currency.decimal_token,
    decimal_places: currency.decimal_places,
    thousands_token: currency.thousands_token,
    currency_exchange_rate: currency.currency_exchange_rate,
  };
}

/**
 * Encodes MoneyFormat as the double-JSON-string the legacy B2B order list API returns
 * and Order.tsx consumes via JSON.parse(JSON.parse(money)).
 */
export function buildLegacyOrderListMoneyString(
  currencies: Currency[],
  currencyCode: string,
): string {
  return JSON.stringify(JSON.stringify(buildMoneyFormat(currencies, currencyCode)));
}

/** Formats a list row grand total using order-specific money when present, else session currency. */
export function formatOrderListGrandTotal(totalIncTax: string | number, money?: string): string {
  if (money) {
    return ordersCurrencyFormat(JSON.parse(JSON.parse(money)), totalIncTax);
  }
  return currencyFormat(totalIncTax);
}
