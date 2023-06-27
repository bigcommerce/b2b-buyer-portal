import { Dispatch, ReactElement, ReactNode } from 'react'

export type AlertTip = 'error' | 'info' | 'success' | 'warning'
export interface MsgsProps {
  title?: string
  msg?: string
  jsx?: () => ReactElement
  id: string | number
  type: AlertTip
  isClose?: boolean
  vertical?: 'top' | 'bottom'
  horizontal?: 'left' | 'right' | 'center'
  time: number
}
export interface TipMessagesProps {
  msgs?: Array<MsgsProps> | []
  autoHideDuration?: number
  vertical?: 'top' | 'bottom'
  horizontal?: 'left' | 'right' | 'center'
  isClose?: boolean
}

export interface DynamicallyVariableState {
  tipMessage: TipMessagesProps
  globalTipMessage: TipMessagesProps
  globalMessageDialog: {
    open: boolean
    title: string
    message: string
    cancelText?: string
    cancelFn?: () => void
    saveText?: string
    saveFn?: () => void
  }
}

export const initState = {
  tipMessage: {},
  globalTipMessage: {},
  globalMessageDialog: {
    open: false,
    title: '',
    message: '',
    cancelText: 'Cancel',
  },
}

export interface DynamicallyVariableAction {
  type: string
  payload: Partial<DynamicallyVariableState>
}

export type DispatchProps = Dispatch<Partial<DynamicallyVariableAction>>
export interface DynamicallyVariableContext {
  state: DynamicallyVariableState
  dispatch: DispatchProps
}

export interface DynamicallyVariableedProviderProps {
  children: ReactNode
}
