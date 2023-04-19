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
    if (moneyFormat.currency_location === 'left') {
      const priceStr = `${
        showCurrencyToken ? moneyFormat.currency_token : ''
      }${(+price * +moneyFormat.currency_exchange_rate)
        .toFixed(moneyFormat.decimal_places)
        .replace(/\B(?=(\d{3})+(?!\d))/g, moneyFormat.thousands_token)}`
      return priceStr
    }
    const priceStr = `${(+price * +moneyFormat.currency_exchange_rate)
      .toFixed(moneyFormat.decimal_places)
      .replace(/\B(?=(\d{3})+(?!\d))/g, moneyFormat.thousands_token)}${
      showCurrencyToken ? moneyFormat.currency_token : ''
    }`
    return priceStr
  } catch (e) {
    console.error(e)
    return ''
  }
}

export default currencyFormat
