import { CompanyStatusKeyType } from '@/utils/companyUtils';

type AlertColor = 'success' | 'info' | 'warning' | 'error';

export type LoginFlagType =
  | 'resetPassword'
  | 'receivePassword'
  | 'loggedOutLogin'
  | 'accountIncorrect'
  | 'accountPrelaunch'
  | 'deviceCrowdingLogIn'
  | 'invoiceErrorTip'
  | CompanyStatusKeyType;

export type LoginTypeConfig = Record<LoginFlagType, { alertType: AlertColor; tip: string }>;
