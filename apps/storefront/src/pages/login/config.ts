/* eslint-disable no-console */
import {
  B3Lang,
} from '@b3/lang'
import globalB3 from '@b3/global-b3'
import {
  validatorRules,
  storeHash,
} from '@/utils'

import {
  bcBaseUrl,
} from '@/utils/basicConfig'

export interface QuoteConfig {
  [key: string]: string
}

export type LoginConfig = {
  emailAddress: string,
  password?: string,
}

export interface LoginInfoInit {
  isShowWidgetHead: boolean,
  isShowWidgetBody?: boolean,
  isShowWidgetFooter: boolean,
  loginTitle: string,
  loginBtn?: string,
  createAccountPanelTittle?: string,
  CreateAccountButtonText: string,
  btnColor: string,
  widgetHeadText: string,
  widgetBodyText: string,
  widgetFooterText: string,
  displayStoreLogo: boolean,
}

export const getLogo = (quoteConfig:Array<QuoteConfig>): string => {
  const item:Array<QuoteConfig> = quoteConfig.filter((list:QuoteConfig) => list.key === 'quote_logo')

  return item[0].isEnabled
}

export interface B3ButtonProps {
  btnColor?: string
}

export interface ValidateOptions extends Record<string, any> {
  max?: string | Number,
  min?: string | Number,
}

interface ChannelIdProps {
  channelId: number,
  urls: Array<string>,
}

export interface ChannelstoreSites {
  storeSites?: Array<ChannelIdProps> | [],
}

export const getForgotPasswordFields = (lang: B3Lang) => [
  {
    name: 'emailAddress',
    label: '',
    labelName: lang('intl.user.login.loginText.emailAddress'),
    required: true,
    default: '',
    fieldType: 'text',
    xs: 12,
    size: 'small',
    validate: validatorRules(['email']),
  },
]

export const getLoginFields = (lang: B3Lang) => [
  {
    name: 'emailAddress',
    label: '',
    labelName: lang('intl.user.login.loginText.emailAddress'),
    required: true,
    default: '',
    fieldType: 'text',
    xs: 12,
    validate: validatorRules(['email']),
  },
  {
    name: 'password',
    label: '',
    labelName: lang('intl.user.login.loginText.password'),
    required: true,
    default: '',
    fieldType: 'password',
    xs: 12,
  },
]

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
  }

  return fetch(`${bcBaseUrl}/internalapi/v1/checkout/customer`, requestOptions)
    .then((response) => response.text())
    .catch((error) => console.log('error', error))
}

export const sendEmail = (emailAddress: string) => {
  const myHeaders = new Headers()

  const urlencoded = new URLSearchParams()
  urlencoded.append('email', emailAddress)

  const requestOptions: any = {
    method: 'POST',
    headers: myHeaders,
    body: urlencoded,
    redirect: 'follow',
  }

  return fetch(`${bcBaseUrl}/login.php?action=send_password_email`, requestOptions)
    .then((response) => response.text())
    .catch((error) => console.log('error', error))
}

export const getloginTokenInfo = (channelId: number) => {
  console.log(globalB3, 'globalB3')
  const {
    origin,
  } = window.location
  const data = {
    storeHash,
    method: 'post',
    url: '/v3/storefront/api-token',
    params: {},
    data: {
      channel_id: channelId || 1,
      expires_at: 1866896353,
      allowed_cors_origins: [
        `${origin}`,
      ],
    },
  }

  return data
}

export const getLoginFlag = (search:string, key:string) => {
  if (!search) {
    return ''
  }
  const searchParams = new URLSearchParams(search)

  return searchParams.get(key)
}

export const getBCChannelId = (storeSitesany: Array<ChannelIdProps>) => {
  if (storeSitesany.length === 1) {
    return storeSitesany[0].channelId
  }

  let channelId: number = 1

  const {
    origin,
  } = window.location

  storeSitesany.forEach((item: ChannelIdProps) => {
    if (item.urls.includes(origin)) {
      channelId = item.channelId
    }
  })

  return channelId
}
