import { LangFormatFunction } from '@b3/lang';

import { baseUrl, validatorRules } from '@/utils';
import b2bLogger from '@/utils/b3Logger';

export interface QuoteConfig {
  [key: string]: string;
}

export type LoginConfig = {
  emailAddress: string;
  password: string;
};

export interface LoginInfoInit {
  loginTitle: string;
  loginBtn?: string;
  createAccountPanelTittle?: string;
  CreateAccountButtonText: string;
  btnColor: string;
  widgetHeadText?: string;
  widgetBodyText: string;
  widgetFooterText?: string;
  displayStoreLogo: boolean;
}

export interface ValidateOptions extends Record<string, any> {
  max?: string | number;
  min?: string | number;
}

interface ChannelIdProps {
  channelId: number;
  urls: Array<string>;
}

export interface ChannelstoreSites {
  storeSites?: Array<ChannelIdProps> | [];
}

export const getForgotPasswordFields = (b3Lang: LangFormatFunction) => [
  {
    name: 'emailAddress',
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
    name: 'emailAddress',
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
    body: JSON.stringify({
      email: data.emailAddress,
      password: data.password,
    }),
  };

  return fetch(`${baseUrl}/internalapi/v1/checkout/customer`, requestOptions).then((response) =>
    response.json(),
  );
};

export const sendEmail = (emailAddress: string) => {
  const urlencoded = new URLSearchParams();
  urlencoded.append('email', emailAddress);

  const requestOptions: RequestInit = {
    method: 'POST',
    body: urlencoded,
    redirect: 'follow',
  };

  return fetch(`${baseUrl}/login.php?action=send_password_email`, requestOptions)
    .then((response) => response.text())
    .catch((error) => b2bLogger.error('error', error));
};

export const getLoginFlag = (search: string, key: string) => {
  if (!search) {
    return '';
  }
  const searchParams = new URLSearchParams(search);

  return searchParams.get(key);
};

export const getBCChannelId = (storeSitesany: Array<ChannelIdProps>) => {
  if (storeSitesany.length === 1) {
    return storeSitesany[0].channelId;
  }

  let channelId = 1;

  const { origin } = window.location;

  storeSitesany.forEach((item: ChannelIdProps) => {
    if (item.urls.includes(origin)) {
      channelId = item.channelId;
    }
  });

  return channelId;
};

export const logout = () =>
  new Promise<boolean>((resolve, reject) => {
    fetch('/login.php?action=logout')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.text();
      })
      .then((responseData) => {
        const isFlag = responseData.includes('alertBox--success');
        resolve(isFlag);
      })
      .catch((e) => {
        reject(e);
      });
  });
