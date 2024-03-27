export interface Currencies {
  currencies: Currency[]
  channelCurrencies: ChannelCurrencies
  enteredInclusiveTax: boolean
}

export interface ChannelCurrencies {
  channel_id: number
  enabled_currencies: string[]
  default_currency: string
}

export interface Currency {
  id: string
  is_default: boolean
  last_updated: string
  country_iso2: string
  default_for_country_codes: string[]
  currency_code: string
  currency_exchange_rate: string
  name: string
  token: string
  auto_update: boolean
  decimal_token: string
  decimal_places: number
  enabled: boolean
  is_transactional: boolean
  token_location: string
  thousands_token: string
}

export interface Node {
  isActive: boolean
  entityId: number
}

export interface ActiveCurrency {
  node: Node
}
