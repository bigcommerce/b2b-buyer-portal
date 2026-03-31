import { LangFormatFunction } from '@/lib/lang';
import { LoginFlagType, LoginTypeConfig } from '@/types/login';
import { BigCommerceStorefrontAPIBaseURL } from '@/utils/basicConfig';
import { CompanyStatusKey } from '@/utils/companyUtils';
import { validatorRules } from '@/utils/validatorRules';

export type LoginConfig = {
  email: string;
  password: string;
};

export const getForgotPasswordFields = (b3Lang: LangFormatFunction) => [
  {
    name: 'email',
    label: b3Lang('global.loginText.emailAddress'),
    required: true,
    default: '',
    fieldType: 'text',
    xs: 12,
    size: 'small',
    variant: 'filled',
    validate: validatorRules(['email']),
  },
];

export const getLoginFields = (b3Lang: LangFormatFunction) => [
  {
    name: 'email',
    label: b3Lang('global.loginText.emailAddress'),
    required: true,
    default: '',
    fieldType: 'text',
    xs: 12,
    variant: 'filled',
    validate: validatorRules(['email']),
    isAutoComplete: true,
  },
  {
    name: 'password',
    label: b3Lang('login.loginText.password'),
    required: true,
    default: '',
    fieldType: 'password',
    xs: 12,
    variant: 'filled',
    isAutoComplete: true,
  },
];

export const loginCheckout = (data: LoginConfig) => {
  const requestOptions = {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(data),
  };

  return fetch(
    // cspell:disable
    `${BigCommerceStorefrontAPIBaseURL}/internalapi/v1/checkout/customer`,
    requestOptions,
  ).then((response) => response.json());
};

export const loginType: LoginTypeConfig = {
  resetPassword: {
    alertType: 'error',
    tip: 'login.loginTipInfo.resetPassword',
  },
  receivePassword: {
    alertType: 'success',
    tip: 'login.loginTipInfo.receivePassword',
  },
  loggedOutLogin: {
    alertType: 'success',
    tip: 'login.loginTipInfo.loggedOutLogin',
  },
  accountIncorrect: {
    alertType: 'error',
    tip: 'login.loginTipInfo.accountIncorrect',
  },
  accountPrelaunch: {
    alertType: 'warning',
    tip: 'login.loginTipInfo.accountPrelaunch',
  },
  deviceCrowdingLogIn: {
    alertType: 'success',
    tip: 'login.loginText.deviceCrowdingLogIn',
  },
  invoiceErrorTip: {
    alertType: 'error',
    tip: 'login.loginText.invoiceErrorTip',
  },
  pendingApprovalToViewPrices: {
    alertType: 'error',
    tip: 'global.statusNotifications.willGainAccessToBusinessFeatProductsAndPricingAfterApproval',
  },
  pendingApprovalToOrder: {
    alertType: 'error',
    tip: 'global.statusNotifications.productsPricingAndOrderingWillBeEnabledAfterApproval',
  },
  pendingApprovalToAccessFeatures: {
    alertType: 'error',
    tip: 'global.statusNotifications.willGainAccessToBusinessFeatAfterApproval',
  },
  accountInactive: {
    alertType: 'error',
    tip: 'global.statusNotifications.businessAccountInactive',
  },
};

export const isLoginFlagType = (value?: unknown): value is LoginFlagType => {
  if (typeof value !== 'string') {
    return false;
  }

  return Object.keys(loginType).includes(value);
};

export const COMPANY_STATUS_MAPPINGS: Record<CompanyStatusKey, string> = {
  pendingApprovalToViewPrices: loginType.pendingApprovalToViewPrices.tip,
  pendingApprovalToOrder: loginType.pendingApprovalToOrder.tip,
  pendingApprovalToAccessFeatures: loginType.pendingApprovalToAccessFeatures.tip,
  accountInactive: loginType.accountInactive.tip,
};

export const SHOULD_LOGOUT_FLAGS: LoginFlagType[] = [
  'loggedOutLogin',
  'pendingApprovalToViewPrices',
  'pendingApprovalToOrder',
  'pendingApprovalToAccessFeatures',
  'accountInactive',
];
