import { B3SStorage } from '@/utils'

interface CurrencyProps {
  auto_update: boolean
  country_iso2: string
  currency_code: string
  currency_exchange_rate: string
  decimal_places: number
  decimal_token: string
  default_for_country_codes: Array<string>
  enabled: boolean
  id: string
  is_default: boolean
  is_transactional: boolean
  last_updated: string
  name: string
  thousands_token: string
  token: string
  token_location: 'left' | 'right'
}

const getDefaultCurrencyInfo = () => {
  const currencies = B3SStorage.get('currencies')
  if (currencies) {
    const { currencies: currencyArr } = currencies

    const defaultCurrency = currencyArr.find(
      (currency: CurrencyProps) => currency.is_default
    )

    return defaultCurrency
  }

  return undefined
}

export default getDefaultCurrencyInfo
