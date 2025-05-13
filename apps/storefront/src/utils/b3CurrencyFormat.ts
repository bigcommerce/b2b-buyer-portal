import { store } from '@/store';

import b2bLogger from './b3Logger';
import { getActiveCurrencyInfo } from './currencyUtils';

interface MoneyFormat {
  currency_location: 'left' | 'right';
  currency_token: string;
  decimal_token: string;
  decimal_places: number;
  thousands_token: string;
  currency_exchange_rate: string;
}

export const currencyFormatInfo = () => {
  const currentCurrency = getActiveCurrencyInfo();

  return {
    currency_location: currentCurrency.token_location || 'left',
    currency_token: currentCurrency.token || '$',
    decimal_token: currentCurrency.decimal_token || '.',
    decimal_places: currentCurrency.decimal_places === 0 ? 0 : currentCurrency.decimal_places || 2,
    thousands_token: currentCurrency.thousands_token || ',',
    currency_exchange_rate: currentCurrency.currency_exchange_rate || '1.0000000000',
  };
};

export const handleGetCorrespondingCurrency = (code: string, value: number) => {
  const { decimal_places: decimalPlaces = 2 } = currencyFormatInfo();
  const { currencies } = store.getState().storeConfigs;
  const { currencies: currencyArr } = currencies;
  let token = '$';
  const correspondingCurrency = currencyArr.find((currency) => currency.currency_code === code);

  if (correspondingCurrency) {
    token = correspondingCurrency.token;
  }

  const accountValue = `${token}${value.toFixed(decimalPlaces)}`;

  return accountValue;
};

export const ordersCurrencyFormat = (
  moneyFormat: MoneyFormat,
  price: string | number,
  showCurrencyToken = true,
) => {
  try {
    const [integerPart, decimalPart] = Number(price).toFixed(moneyFormat.decimal_places).split('.');
    const newPrice = `${integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, moneyFormat.thousands_token)}${
      decimalPart ? `${moneyFormat.decimal_token}${decimalPart}` : ''
    }`;
    const priceStr =
      moneyFormat.currency_location === 'left'
        ? `${showCurrencyToken ? moneyFormat.currency_token : ''}${newPrice}`
        : `${newPrice}${showCurrencyToken ? moneyFormat.currency_token : ''}`;
    return priceStr;
  } catch (e) {
    b2bLogger.error(e);
    return '';
  }
};

interface CurrencyOption {
  currency: CurrencyProps;
  showCurrencyToken?: boolean;
  isConversionRate?: boolean;
  useCurrentCurrency?: boolean;
}

export const currencyFormatConvert = (
  price: string | number,
  {
    currency,
    showCurrencyToken = true,
    isConversionRate = true,
    useCurrentCurrency = false,
  }: CurrencyOption,
) => {
  const currentCurrency = {
    currency_location: currency?.location || 'left',
    currency_token: currency?.token || '$',
    decimal_token: currency?.decimalToken || '.',
    decimal_places: currency?.decimalPlaces === 0 ? 0 : currency?.decimalPlaces || 2,
    thousands_token: currency?.thousandsToken || ',',
    currency_exchange_rate: currency?.currencyExchangeRate || '1.0000000000',
  };

  const moneyFormat = useCurrentCurrency ? currentCurrency : currencyFormatInfo();

  try {
    if (currency?.currencyExchangeRate) {
      const [integerPart, decimalPart] = (
        isConversionRate
          ? Number(price) *
            (Number(moneyFormat.currency_exchange_rate) / Number(currency.currencyExchangeRate))
          : Number(price)
      )
        .toFixed(moneyFormat.decimal_places)
        .split('.');
      const newPrice = `${integerPart.replace(
        /\B(?=(\d{3})+(?!\d))/g,
        moneyFormat.thousands_token,
      )}${decimalPart ? `${moneyFormat.decimal_token}${decimalPart}` : ''}`;
      const priceStr =
        moneyFormat.currency_location === 'left'
          ? `${showCurrencyToken ? moneyFormat.currency_token : ''}${newPrice}`
          : `${newPrice}${showCurrencyToken ? moneyFormat.currency_token : ''}`;
      return priceStr;
    }
    const [integerPart, decimalPart] = Number(price).toFixed(moneyFormat.decimal_places).split('.');
    const newPrice = `${integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, moneyFormat.thousands_token)}${
      decimalPart ? `${moneyFormat.decimal_token}${decimalPart}` : ''
    }`;
    const priceStr =
      moneyFormat.currency_location === 'left'
        ? `${showCurrencyToken ? moneyFormat.currency_token : ''}${newPrice}`
        : `${newPrice}${showCurrencyToken ? moneyFormat.currency_token : ''}`;
    return priceStr;
  } catch (e) {
    b2bLogger.error(e);
    return '';
  }
};

const currencyFormat = (
  price: string | number,
  showCurrencyToken = true,
  isConversionRate = false,
) => {
  const moneyFormat = currencyFormatInfo();
  try {
    const [integerPart, decimalPart] = (
      isConversionRate ? Number(price) * Number(moneyFormat.currency_exchange_rate) : Number(price)
    )
      .toFixed(moneyFormat.decimal_places)
      .split('.');
    const newPrice = `${integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, moneyFormat.thousands_token)}${
      decimalPart ? `${moneyFormat.decimal_token}${decimalPart}` : ''
    }`;
    const priceStr =
      moneyFormat.currency_location === 'left'
        ? `${showCurrencyToken ? moneyFormat.currency_token : ''}${newPrice}`
        : `${newPrice}${showCurrencyToken ? moneyFormat.currency_token : ''}`;
    return priceStr;
  } catch (e) {
    b2bLogger.error(e);
    return '';
  }
};

export default currencyFormat;
