type AlertColor = 'success' | 'info' | 'warning' | 'error';

export type LoginFlagType =
  | 'resetPassword'
  | 'receivePassword'
  | 'loggedOutLogin'
  | 'accountIncorrect'
  | 'accountPrelaunch'
  | 'deviceCrowdingLogIn'
  | 'invoiceErrorTip';

export type LoginTypeConfig = Record<LoginFlagType, { alertType: AlertColor; tip: string }>;
