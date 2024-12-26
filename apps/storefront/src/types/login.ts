export type AlertColor = 'success' | 'info' | 'warning' | 'error';

export type LoginFlagType =
  | 'resetPassword'
  | 'receivePassword'
  | 'loggedOutLogin'
  | 'accountIncorrect'
  | 'accountPrelaunch'
  | 'deviceCrowdingLogIn'
  | 'invoiceErrorTip'
  | '';

type ValidLoginFlagType = Exclude<LoginFlagType, ''>;

export type LoginTypeConfig = Record<ValidLoginFlagType, { alertType: AlertColor; tip: string }>;
