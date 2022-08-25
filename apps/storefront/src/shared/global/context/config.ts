import {
  Dispatch,
  ReactNode,
} from 'react'

import {
  B3SStorage,
} from '@/utils'

export interface GlobalState {
  isCheckout: boolean,
  isCloseGotoBCHome: boolean,
  BcToken: string,
  isB2BUser: boolean,
  role: number,
}

export const initState = {
  isCheckout: false,
  isCloseGotoBCHome: false,
  BcToken: B3SStorage.get('BcToken') || '',
  isB2BUser: false,
  role: 0,
}

export interface GlobalAction {
  type: string,
  payload: Partial<GlobalState>
}
export interface GlobalContext {
  state: GlobalState,
  dispatch: Dispatch<Partial<GlobalAction>>,
}

export interface GlobaledProviderProps {
  children: ReactNode
}
