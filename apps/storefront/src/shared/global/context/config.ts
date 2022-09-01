import {
  Dispatch,
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

export interface GlobalState {
  isCheckout: boolean,
  isCloseGotoBCHome: boolean,
  BcToken: string,
  isB2BUser: boolean,
  isLogin: boolean,
  customerId: number | string,
  customer?: CustomerInfo,
  emailAddress: string,
  role: number | string,
}

export const initState = {
  isCheckout: false,
  isCloseGotoBCHome: false,
  BcToken: B3SStorage.get('BcToken') || '',
  isB2BUser: B3SStorage.get('isB2BUser') || false,
  isLogin: false,
  customerId: B3SStorage.get('B3CustomerId') || '',
  emailAddress: B3SStorage.get('B3EmailAddress') || '',
  role: B3SStorage.get('B3Role') || '',
  customer: B3SStorage.get('B3CustomerInfo') || {},
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
