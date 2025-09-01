import { LangFormatFunction } from '@/lib/lang';
import { LoginFlagType, LoginTypeConfig } from '@/types/login';
import { BigCommerceStorefrontAPIBaseURL, validatorRules } from '@/utils';
import b2bLogger from '@/utils/b3Logger';

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

export const getLoginFields = (b3Lang: LangFormatFunction, submitLoginFn: () => void) => [
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
    isEnterTrigger: true,
    handleEnterClick: submitLoginFn,
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

export const sendForgotPasswordEmailFor = (email: string) => {
  const urlencoded = new URLSearchParams();
  urlencoded.append('email', email);

  const requestOptions: RequestInit = {
    method: 'POST',
    body: urlencoded,
    redirect: 'follow',
  };

  return fetch(
    `${BigCommerceStorefrontAPIBaseURL}/login.php?action=send_password_email`,
    requestOptions,
  )
    .then((response) => response.text())
    .catch((error) => b2bLogger.error('error', error));
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
};

export const isLoginFlagType = (value?: unknown): value is LoginFlagType => {
  if (typeof value !== 'string') {
    return false;
  }

  return Object.keys(loginType).includes(value);
};
