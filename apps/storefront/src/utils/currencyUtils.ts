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

interface ActiveCurrencyProps {
  node: {
    entityId: number
    isActive: boolean
  }
}

const getActiveCurrencyInfo = () => {
  const { currencies } = B3SStorage.get('currencies')
  const { node: activeCurrencyObj }: ActiveCurrencyProps =
    B3SStorage.get('activeCurrency')
  const activeCurrency: CurrencyProps = currencies.find(
    (currency: CurrencyProps) => +currency.id === activeCurrencyObj.entityId
  )

  return activeCurrency
}

const getDefaultCurrencyInfo = () => {
  const currencies = B3SStorage.get('currencies')
  const { currencies: currencyArr } = currencies

  const activeCurrency = getActiveCurrencyInfo()

  let defaultCurrency: CurrencyProps
  if (activeCurrency.enabled) {
    defaultCurrency = currencyArr.find(
      (currency: CurrencyProps) => +currency.id === +activeCurrency.id
    )
  } else {
    defaultCurrency = currencyArr.find(
      (currency: CurrencyProps) => currency.is_default
    )
  }

  return defaultCurrency
}

export { getActiveCurrencyInfo, getDefaultCurrencyInfo }
