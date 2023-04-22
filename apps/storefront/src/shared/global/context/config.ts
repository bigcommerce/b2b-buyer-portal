import { Dispatch, ReactNode } from 'react'

import { B3SStorage } from '@/utils'

export interface CustomerInfo {
  phoneNumber: string
  firstName: string
  lastName: string
  emailAddress: string
}

export type AlertTip = 'error' | 'info' | 'success' | 'warning'
export interface State {
  stateCode?: string
  stateName?: string
  id?: string
}
export interface Country {
  countryCode: string
  countryName: string
  id?: string
  states: State[]
}

export interface ChannelCurrenciesProps {
  channel_id: number
  default_currency: string
  enabled_currencies: Array<string>
}

export interface CurrencyProps {
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
  token_location: string
}

export interface OpenAPPParamsProps {
  quoteBtn: string
  shoppingListBtn: string
}

export interface GlobalState {
  isCheckout: boolean
  isCloseGotoBCHome: boolean
  BcToken: string
  isB2BUser: boolean
  customerId: number | string
  customer: CustomerInfo
  companyInfo: {
    id: string | number
    companyName: string | number
    companyStatus: string | number
  }
  emailAddress: string
  role: number | string
  logo: string
  isCompanyAccount: boolean
  isAgenting: boolean
  salesRepCompanyId: string
  salesRepCompanyName: string
  B3UserId: number | string
  // tipMessage: TipMessagesProps,
  addressConfig?: {
    key: string
    isEnabled: string
  }[]
  storefrontConfig?: {
    [k: string]:
      | boolean
      | {
          value: boolean
          enabledStatus: boolean
        }
    shoppingLists: boolean
  }
  storeEnabled: boolean
  storeName: string
  currentChannelId: number
  b2bChannelId: number
  countriesList?: Country[]
  productQuoteEnabled: boolean
  cartQuoteEnabled: boolean
  shoppingListEnabled: boolean
  quoteConfig: CustomFieldItems[]
  currencies: {
    channelCurrencies: ChannelCurrenciesProps
    currencies: CurrencyProps
  }
  openAPPParams: OpenAPPParamsProps
  showPageMask: boolean
}

export const initState = {
  isCheckout: false,
  isCloseGotoBCHome: false,
  BcToken: B3SStorage.get('BcToken') || '',
  isB2BUser: B3SStorage.get('isB2BUser') || false,
  customerId: B3SStorage.get('B3CustomerId') || '',
  B3UserId: B3SStorage.get('B3UserId') || '',
  emailAddress: B3SStorage.get('B3EmailAddress') || '',
  /* role:
   * 0: admin, 1: senior 2: buyer, 3: super admin, 99: bc user, 100: guest
   */
  role:
    B3SStorage.get('B3Role') || B3SStorage.get('B3Role') === 0
      ? B3SStorage.get('B3Role')
      : 100,
  isAgenting: B3SStorage.get('isAgenting') || false,
  salesRepCompanyId: B3SStorage.get('salesRepCompanyId') || '',
  salesRepCompanyName: B3SStorage.get('salesRepCompanyName') || '',
  customer: B3SStorage.get('B3CustomerInfo') || {
    firstName: '',
    lastName: '',
    phoneNumber: '',
    emailAddress: '',
  },
  companyInfo: B3SStorage.get('B3CompanyInfo') || {
    id: '',
    companyName: '',
    companyStatus: '',
  },
  logo: '',
  isCompanyAccount: false,
  storeEnabled: false,
  storeName: '',
  currentChannelId: 1,
  b2bChannelId: 1,
  countriesList: [],
  productQuoteEnabled: false,
  cartQuoteEnabled: false,
  shoppingListEnabled: false,
  quoteConfig: [],
  currencies: B3SStorage.get('currencies') || {},
  openAPPParams: {
    quoteBtn: '',
    shoppingListBtn: '',
  },
  showPageMask: false,
}

export interface GlobalAction {
  type: string
  payload: Partial<GlobalState>
}

export type DispatchProps = Dispatch<Partial<GlobalAction>>
export interface GlobalContext {
  state: GlobalState
  dispatch: DispatchProps
}

export interface GlobaledProviderProps {
  children: ReactNode
}
