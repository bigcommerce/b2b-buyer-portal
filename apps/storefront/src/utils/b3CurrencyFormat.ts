import getDefaultCurrencyInfo from './currencyUtils'

interface MoneyFormat {
  currency_location: 'left' | 'right'
  currency_token: string
  decimal_token: string
  decimal_places: number
  thousands_token: string
  currency_exchange_rate: string
}

const currencyFormat = (price: string | number, showCurrencyToken = true) => {
  const currentCurrency = getDefaultCurrencyInfo()

  const moneyFormat: MoneyFormat = {
    currency_location: currentCurrency?.token_location || 'left',
    currency_token: currentCurrency?.token || '$',
    decimal_token: currentCurrency?.decimal_token || '.',
    decimal_places: currentCurrency?.decimal_places || 2,
    thousands_token: currentCurrency?.thousands_token || ',',
    currency_exchange_rate:
      currentCurrency?.currency_exchange_rate || '1.0000000000',
  }

  try {
    const newPrice = `${(+price * +moneyFormat.currency_exchange_rate)
      .toFixed(moneyFormat.decimal_places)
      .replace(/\B(?=(\d{3})+(?!\d))/g, moneyFormat.thousands_token)}`
    const priceStr =
      moneyFormat.currency_location === 'left'
        ? `${showCurrencyToken ? moneyFormat.currency_token : ''}${newPrice}`
        : `${newPrice}${showCurrencyToken ? moneyFormat.currency_token : ''}`
    const location = priceStr.lastIndexOf('.')
    const newPriceStr = `${priceStr.slice(0, location)}${
      moneyFormat.decimal_token
    }${priceStr.slice(location + 1)}`
    return newPriceStr
  } catch (e) {
    console.error(e)
    return ''
  }
}

export default currencyFormat
