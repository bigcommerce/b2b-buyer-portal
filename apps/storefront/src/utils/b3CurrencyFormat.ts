import getDefaultCurrencyInfo from './currencyUtils'

interface MoneyFormat {
  token_location: 'left' | 'right'
  token: string
  decimal_token: string
  decimal_places: number
  thousands_token: string
  currency_exchange_rate: string
}

const currencyFormat = (price: string | number, showCurrencyToken = true) => {
  const {
    token_location: tokenLocation = 'left',
    token: currencyToken = '$',
    decimal_token: decimalToken = '.',
    decimal_places: decimalPlaces = 2,
    thousands_token: thousandsToken = ',',
    currency_exchange_rate: currencyExchangeRate = '1.0000000000',
  }: MoneyFormat = getDefaultCurrencyInfo() || {}

  try {
    const priceValue = +price * +currencyExchangeRate
    const [integerPart, decimalPart = ''] = priceValue
      .toFixed(decimalPlaces)
      .split('.')
    const integerPartWithSeparator = integerPart.replace(
      /\B(?=(\d{3})+(?!\d\.))/g,
      thousandsToken
    )
    const priceStr = `${integerPartWithSeparator}${
      decimalPart ? `${decimalToken}${decimalPart}` : ''
    }`

    return tokenLocation === 'left'
      ? `${showCurrencyToken ? currencyToken : ''}${priceStr}`
      : `${priceStr}${showCurrencyToken ? currencyToken : ''}`
  } catch (e) {
    console.error(e)
    return ''
  }
}

export default currencyFormat
