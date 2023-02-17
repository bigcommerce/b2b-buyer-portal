import {
  Dispatch,
  ReactElement,
  ReactNode,
} from 'react'

import {
  B3SStorage,
} from '@/utils'

export interface CustomerInfo {
  phoneNumber: string,
  firstName: string,
  lastName: string,
  emailAddress: string,
}

export type AlertTip = 'error' | 'info' | 'success' | 'warning'
export interface MsgsProps {
  title?: string,
  msg?: string,
  jsx?: () => ReactElement,
  id: string | number,
  type: AlertTip
  isClose?: boolean,
  vertical?: 'top' | 'bottom'
  horizontal?: 'left' | 'right' | 'center'
}
export interface TipMessagesProps{
  msgs?: Array<MsgsProps> | [],
  autoHideDuration?: number,
  vertical?: 'top' | 'bottom'
  horizontal?: 'left' | 'right' | 'center'
  isClose?: boolean
}
export interface State {
  stateCode?: string,
  stateName?: string,
  id?: string,
}
export interface Country {
  countryCode: string,
  countryName: string,
  id?: string,
  states: State[]
}

export interface channelCurrenciesProps {
  channel_id: number,
  default_currency: string,
  enabled_currencies: Array<string>,
}

export interface currencyProps {
  auto_update: boolean,
  country_iso2: string,
  currency_code: string,
  currency_exchange_rate: string,
  decimal_places: number,
  decimal_token: string,
  default_for_country_codes: Array<string>,
  enabled: boolean,
  id: string,
  is_default: boolean,
  is_transactional: boolean,
  last_updated: string,
  name: string,
  thousands_token: string,
  token: string,
  token_location: string,
}

export interface GlobalState {
  isCheckout: boolean,
  isCloseGotoBCHome: boolean,
  BcToken: string,
  isB2BUser: boolean,
  isLogin: boolean,
  isLoginStatusChange: boolean,
  customerId: number | string,
  customer: CustomerInfo,
  companyInfo: {
    id: string | number,
    companyName: string | number,
    companyStatus: string | number,
  },
  emailAddress: string,
  role: number | string,
  logo: string,
  isCompanyAccount: boolean,
  isAgenting: boolean,
  salesRepCompanyId: string,
  salesRepCompanyName: string,
  B3UserId: boolean,
  tipMessage: TipMessagesProps,
  addressConfig?: {
    key: string,
    isEnabled: string,
  }[],
  storefrontConfig?: {
    [k: string]: boolean | {
      value: boolean,
      enabledStatus: boolean,
    },
  },
  storeEnabled: boolean,
  storeName: string,
  currentChannelId: number,
  b2bChannelId: number,
  countriesList?: Country[],
  productQuoteEnabled: boolean,
  cartQuoteEnabled: boolean,
  quoteConfig: {
    switchStatus: {
      [key: string]: string
    }[],
    otherConfigs: {
      [key: string]: string
    }[],
  },
  globalMessageDialog: {
    open: boolean,
    title: string,
    message: string,
    cancelText?: string,
    cancelFn?: () => void,
    saveText?: string,
    saveFn?: () => void,
  },
  currencies: {
    channelCurrencies: channelCurrenciesProps,
    currencies: currencyProps,
  },
}

const role = B3SStorage.get('B3Role')

export const initState = {
  isCheckout: false,
  isCloseGotoBCHome: false,
  BcToken: B3SStorage.get('BcToken') || '',
  isB2BUser: B3SStorage.get('isB2BUser') || false,
  isLogin: false,
  isLoginStatusChange: false,
  customerId: B3SStorage.get('B3CustomerId') || '',
  B3UserId: B3SStorage.get('B3UserId') || '',
  emailAddress: B3SStorage.get('B3EmailAddress') || '',
  /* role:
   * 0: admin, 1: senior 2: buyer, 3: super admin, 99: bc user, 100: guest
  */
  role: (role || role === 0) ? role : 100,
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
  tipMessage: {},
  storeEnabled: false,
  storeName: '',
  currentChannelId: 1,
  b2bChannelId: 1,
  countriesList: [],
  productQuoteEnabled: false,
  cartQuoteEnabled: false,
  quoteConfig: {
    switchStatus: [],
    otherConfigs: [],
  },
  globalMessageDialog: {
    open: false,
    title: '',
    message: '',
    cancelText: 'Cancel',
  },
  currencies: B3SStorage.get('currencies') || {},
}

export interface GlobalAction {
  type: string,
  payload: Partial<GlobalState>
}

export type DispatchProps = Dispatch<Partial<GlobalAction>>
export interface GlobalContext {
  state: GlobalState,
  dispatch: DispatchProps,
}

export interface GlobaledProviderProps {
  children: ReactNode
}
