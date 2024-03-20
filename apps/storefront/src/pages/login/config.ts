import { LangFormatFunction } from '@b3/lang'

import { b2bLogger, storeHash, validatorRules } from '@/utils'
import { bcBaseUrl } from '@/utils/basicConfig'

export interface QuoteConfig {
  [key: string]: string
}

export type LoginConfig = {
  emailAddress: string
  password: string
}

export interface LoginInfoInit {
  isShowWidgetHead: boolean
  isShowWidgetBody?: boolean
  isShowWidgetFooter: boolean
  loginTitle: string
  loginBtn?: string
  createAccountPanelTittle?: string
  CreateAccountButtonText: string
  btnColor: string
  widgetHeadText: string
  widgetBodyText: string
  widgetFooterText: string
  displayStoreLogo: boolean
}

export const getLogo = (quoteConfig: Array<QuoteConfig>): string => {
  const item: Array<QuoteConfig> = quoteConfig.filter(
    (list: QuoteConfig) => list.key === 'quote_logo'
  )

  return item[0].isEnabled
}

export interface ValidateOptions extends Record<string, any> {
  max?: string | number
  min?: string | number
}

interface ChannelIdProps {
  channelId: number
  urls: Array<string>
}

export interface ChannelstoreSites {
  storeSites?: Array<ChannelIdProps> | []
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
]

export const getLoginFields = (
  b3Lang: LangFormatFunction,
  submitLoginFn: () => void
) => [
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

  return fetch(
    `${bcBaseUrl()}/internalapi/v1/checkout/customer`,
    requestOptions
  )
    .then((response) => response.text())
    .catch((error) => b2bLogger.error('error', error))
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

  return fetch(
    `${bcBaseUrl()}/login.php?action=send_password_email`,
    requestOptions
  )
    .then((response) => response.text())
    .catch((error) => b2bLogger.error('error', error))
}

export const getloginTokenInfo = (channelId: number) => {
  const { origin } = window.location
  const data = {
    storeHash,
    method: 'post',
    url: '/v3/storefront/api-token',
    params: {},
    data: {
      channel_id: channelId || 1,
      expires_at: 1866896353,
      allowed_cors_origins: [`${origin}`],
    },
  }

  return data
}

export const getLoginFlag = (search: string, key: string) => {
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

  let channelId = 1

  const { origin } = window.location

  storeSitesany.forEach((item: ChannelIdProps) => {
    if (item.urls.includes(origin)) {
      channelId = item.channelId
    }
  })

  return channelId
}

export const logout = () =>
  new Promise<boolean>((resolve, reject) => {
    fetch('/login.php?action=logout')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok')
        }
        return response.text()
      })
      .then((responseData) => {
        const isFlag = responseData.includes('alertBox--success')
        resolve(isFlag)
      })
      .catch((e) => {
        reject(e)
      })
  })
