import globalB3 from '@b3/global-b3'

import { B3SStorage } from './b3Storage'
import { getActiveCurrencyInfo, getDefaultCurrencyInfo } from './currencyUtils'

interface MoneyFormat {
  currency_location: 'left' | 'right'
  currency_token: string
  decimal_token: string
  decimal_places: number
  thousands_token: string
  currency_exchange_rate: string
}

export const currencyFormatInfo = () => {
  const currentCurrency = globalB3?.setting?.is_local_debugging
    ? getDefaultCurrencyInfo()
    : getActiveCurrencyInfo()

  return {
    currency_location: currentCurrency.token_location || 'left',
    currency_token: currentCurrency.token || '$',
    decimal_token: currentCurrency.decimal_token || '.',
    decimal_places:
      currentCurrency.decimal_places === 0
        ? 0
        : currentCurrency.decimal_places || 2,
    thousands_token: currentCurrency.thousands_token || ',',
    currency_exchange_rate:
      currentCurrency.currency_exchange_rate || '1.0000000000',
  }
}

export const handleGetCorrespondingCurrency = (code: string, value: number) => {
  const { decimal_places: decimalPlaces = 2 } = currencyFormatInfo()
  const allCurrencies = B3SStorage.get('currencies')
  const { currencies: currencyArr } = allCurrencies
  let token = '$'
  const correspondingCurrency =
    currencyArr.find(
      (currency: CustomFieldItems) => currency.currency_code === code
    ) || {}

  if (correspondingCurrency) {
    token = correspondingCurrency.token
  }

  const accountValue = `${token}${value.toFixed(decimalPlaces)}`

  return accountValue
}

export const ordersCurrencyFormat = (
  moneyFormat: MoneyFormat,
  price: string | number,
  showCurrencyToken = true
) => {
  try {
    const [integerPart, decimalPart] = (+price)
      .toFixed(moneyFormat.decimal_places)
      .split('.')
    const newPrice = `${integerPart.replace(
      /\B(?=(\d{3})+(?!\d))/g,
      moneyFormat.thousands_token
    )}${decimalPart ? `${moneyFormat.decimal_token}${decimalPart}` : ''}`
    const priceStr =
      moneyFormat.currency_location === 'left'
        ? `${showCurrencyToken ? moneyFormat.currency_token : ''}${newPrice}`
        : `${newPrice}${showCurrencyToken ? moneyFormat.currency_token : ''}`
    return priceStr
  } catch (e) {
    console.error(e)
    return ''
  }
}

const currencyFormat = (price: string | number, showCurrencyToken = true) => {
  const moneyFormat: MoneyFormat = currencyFormatInfo()

  try {
    const [integerPart, decimalPart] = (
      +price * +moneyFormat.currency_exchange_rate
    )
      .toFixed(moneyFormat.decimal_places)
      .split('.')
    const newPrice = `${integerPart.replace(
      /\B(?=(\d{3})+(?!\d))/g,
      moneyFormat.thousands_token
    )}${decimalPart ? `${moneyFormat.decimal_token}${decimalPart}` : ''}`
    const priceStr =
      moneyFormat.currency_location === 'left'
        ? `${showCurrencyToken ? moneyFormat.currency_token : ''}${newPrice}`
        : `${newPrice}${showCurrencyToken ? moneyFormat.currency_token : ''}`
    return priceStr
  } catch (e) {
    console.error(e)
    return ''
  }
}

export default currencyFormat
