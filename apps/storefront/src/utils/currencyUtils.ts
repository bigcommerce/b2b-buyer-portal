import { activeCurrencyInfoSelector, store } from '@/store';
import { Currency, DisplayCurrency } from '@/types';

const getActiveCurrencyInfo = () => activeCurrencyInfoSelector(store.getState());

const getCorrespondingCurrency = (code: string): Currency | undefined =>
  store
    .getState()
    .storeConfigs.currencies.currencies.find((currency) => currency.currency_code === code);

// BC returns token_location as 'left'/'right', but casing varies ('LEFT'), so compare case-insensitively.
const applyCurrencyToken = (code: string, formattedAmount: string): string => {
  const currency = getCorrespondingCurrency(code);
  const token = currency?.token || '$';

  return currency?.token_location?.toLowerCase() === 'right'
    ? `${formattedAmount}${token}`
    : `${token}${formattedAmount}`;
};

const formatBcCurrencyToDisplayCurrency = (bcCurrency: Currency): DisplayCurrency => ({
  token: bcCurrency.token,
  location: bcCurrency.token_location,
  currencyCode: bcCurrency.currency_code,
  decimalToken: bcCurrency.decimal_token,
  decimalPlaces: bcCurrency.decimal_places,
  thousandsToken: bcCurrency.thousands_token,
  currencyExchangeRate: bcCurrency.currency_exchange_rate,
});

const buildCurrenciesMap = (currencies: Currency[]): Record<string, DisplayCurrency> =>
  currencies.reduce<Record<string, DisplayCurrency>>((acc, currency) => {
    acc[currency.currency_code] = formatBcCurrencyToDisplayCurrency(currency);
    return acc;
  }, {});

export {
  getActiveCurrencyInfo,
  getCorrespondingCurrency,
  applyCurrencyToken,
  buildCurrenciesMap,
  formatBcCurrencyToDisplayCurrency,
};
