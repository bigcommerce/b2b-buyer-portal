import { Dispatch, ReactNode } from 'react';

export type AlertTip = 'error' | 'info' | 'success' | 'warning';
export interface MsgsProps {
  msg?: string;
  description?: string;
  id: string | number;
  type: AlertTip;
  time: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}
export interface TipMessagesProps {
  msgs?: Array<MsgsProps> | [];
  autoHideDuration?: number;
  vertical?: 'top' | 'bottom';
  horizontal?: 'left' | 'right' | 'center';
  isClose?: boolean;
}

export interface DynamicallyVariableState {
  tipMessage: TipMessagesProps;
  globalTipMessage: TipMessagesProps;
  globalMessageDialog: {
    open: boolean;
    title: string;
    message: string;
    cancelText?: string;
    cancelFn?: () => void;
    saveText?: string;
    saveFn?: () => void;
  };
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
};

export interface DynamicallyVariableAction {
  type: string;
  payload: Partial<DynamicallyVariableState>;
}

type DispatchProps = Dispatch<Partial<DynamicallyVariableAction>>;

export interface DynamicallyVariableContextInterface {
  state: DynamicallyVariableState;
  dispatch: DispatchProps;
}

export interface DynamicallyVariableProviderProps {
  children: ReactNode;
}
