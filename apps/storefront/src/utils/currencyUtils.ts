import { activeCurrencyInfoSelector, store } from '@/store';
import { Currency, DisplayCurrency } from '@/types';

const getActiveCurrencyInfo = () => activeCurrencyInfoSelector(store.getState());

const handleGetCorrespondingCurrencyToken = (code: string) => {
  const correspondingCurrency = store
    .getState()
    .storeConfigs.currencies.currencies.find((currency) => currency.currency_code === code);
  let token = '$';

  if (correspondingCurrency?.token) {
    token = correspondingCurrency.token;
  }

  return token;
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
  handleGetCorrespondingCurrencyToken,
  buildCurrenciesMap,
  formatBcCurrencyToDisplayCurrency,
};
