import { store } from '@/store';
import { defaultCurrenciesState } from '@/store/slices/storeConfigs';
import { Currency } from '@/types';

const defaultCurrency: Currency = defaultCurrenciesState.currencies[0];

const getActiveCurrencyInfo = () => {
  const { currencies } = store.getState().storeConfigs.currencies;
  const activeCurrencyObj = store.getState().storeConfigs.activeCurrency?.node;
  const activeCurrency = currencies.find(
    (currency) => Number(currency.id) === activeCurrencyObj?.entityId,
  );

  return activeCurrency || defaultCurrency;
};

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

export { getActiveCurrencyInfo, handleGetCorrespondingCurrencyToken };
