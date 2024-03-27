import { store } from '@/store'
import { defaultCurrenciesState } from '@/store/slices/storeConfigs'
import { ActiveCurrency, Currencies, Currency } from '@/types'

const defaultCurrency = defaultCurrenciesState.currencies[0]

const getActiveCurrencyInfo = () => {
  const { currencies } = store.getState().storeConfigs.currencies as Currencies
  const { node: activeCurrencyObj }: ActiveCurrency = store.getState()
    .storeConfigs.activeCurrency as ActiveCurrency
  const activeCurrency: Currency | undefined = currencies.find(
    (currency: Currency) => +currency.id === activeCurrencyObj.entityId
  )

  return activeCurrency || defaultCurrency
}

const getDefaultCurrencyInfo = () => {
  const currencies = store.getState().storeConfigs.currencies as Currencies
  const { currencies: currencyArr } = currencies

  const defaultFoundCurrency: Currency | undefined = currencyArr.find(
    (currency: Currency) => currency.is_default
  )
  return defaultFoundCurrency || defaultCurrency
}

const handleGetCorrespondingCurrencyToken = (code: string) => {
  const allCurrencies = store.getState().storeConfigs.currencies as Currencies
  if (!allCurrencies) return '$'
  const { currencies: currencyArr } = allCurrencies
  let token = '$'
  const correspondingCurrency = currencyArr.find(
    (currency: CustomFieldItems) => currency.currency_code === code
  ) || { token: '$' }

  if (correspondingCurrency) {
    token = correspondingCurrency.token
  }

  return token
}

export {
  getActiveCurrencyInfo,
  getDefaultCurrencyInfo,
  handleGetCorrespondingCurrencyToken,
}
