import { DispatchProps } from '@/shared/global/context/config'
import {
  getAgentInfo,
  getB2BCompanyUserInfo,
  getB2BToken,
  getBCToken,
  getUserCompany,
} from '@/shared/service/b2b'
import { getBcCurrentJWT, getCustomerInfo } from '@/shared/service/bc'
import { B3LStorage, B3SStorage, storeHash } from '@/utils'

const { VITE_B2B_CLIENT_ID } = import.meta.env

interface ChannelIdProps {
  channelId: number
  urls: Array<string>
  b2bEnabled: boolean
  channelLogo: string
  b3ChannelId?: number
  type: string
  platform: string
}

type B2BToken = {
  authorization: {
    result: {
      token: string
    }
  }
}

// B3Role = {
//   ADMIN: '0',
//   SENIOR: '1',
//   JUNIOR: '2',
//   SALESREP: '3',
// }

export interface ChannelStoreSites {
  storeSites?: Array<ChannelIdProps> | []
}

export const getCurrentStoreInfo = (storeSites: Array<ChannelIdProps>) => {
  const newStoreSites =
    storeSites.filter(
      (site: ChannelIdProps) =>
        site.type === 'storefront' && site.platform === 'bigcommerce'
    ) || []

  const store: ChannelIdProps = {
    channelId: 1,
    urls: [],
    b2bEnabled: true,
    channelLogo: '',
    b3ChannelId: 16,
    type: 'storefront',
    platform: 'bigcommerce',
  }

  const { origin } = window.location
  const storeItem =
    newStoreSites.find((item: ChannelIdProps) => item.urls.includes(origin)) ||
    store

  return storeItem
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

export const loginInfo = async () => {
  const channelId = B3SStorage.get('B3channelId')
  const loginTokenInfo = getloginTokenInfo(channelId)
  const {
    data: { token },
  } = await getBCToken(loginTokenInfo)

  B3SStorage.set('BcToken', token)
}

export const clearCurrentCustomerInfo = async (dispatch: DispatchProps) => {
  B3SStorage.set('B3CustomerInfo', {})
  B3SStorage.set('B3CustomerId', '')
  B3SStorage.set('B3EmailAddress', '')
  B3SStorage.set('B3Role', '')
  B3SStorage.set('isB2BUser', false)
  B3SStorage.set('bcJwtToken', '')
  B3SStorage.set('B3B2BToken', false)
  B3SStorage.set('B3UserId', '')

  B3SStorage.set('salesRepCompanyName', '')
  B3SStorage.set('nextPath', '')
  B3SStorage.set('salesRepCompanyId', '')
  B3SStorage.set('isAgenting', '')

  B3SStorage.set('isShowBlockPendingAccountOrderCreationTip', {})

  dispatch({
    type: 'common',
    payload: {
      isB2BUser: false,
      role: 100,
      customerId: '',
      customer: {
        phoneNumber: '',
        firstName: '',
        lastName: '',
        emailAddress: '',
      },
      emailAddress: '',
      salesRepCompanyId: '',
      salesRepCompanyName: '',
      isAgenting: false,
    },
  })
}

export const getCurrentJwt = async () => {
  try {
    const res = await getBcCurrentJWT({
      app_client_id: VITE_B2B_CLIENT_ID,
    })

    B3SStorage.set('bcJwtToken', res)
    return res
  } catch (error) {
    console.log(error)
  }
  return undefined
}

const getCurrentJwtAndB2BToken = async (userType: number) => {
  try {
    const res = await getCurrentJwt()

    const channelId = B3SStorage.get('B3channelId') || 1

    if (userType === 3) {
      const data = await getB2BToken(res, channelId)
      if (data) {
        const B3B2BToken = (data as B2BToken).authorization.result.token
        B3SStorage.set('B3B2BToken', B3B2BToken)
      }
    }
  } catch (error) {
    console.log(error)
  }
}

// companyStatus
// 99: default, Distinguish between bc and b2b
// 0: pending
// 1: approved
// 2: rejected
// 3: inactive
// 4: deleted

const getCompanyInfo = async (id: number, userType: number, role: number) => {
  let companyInfo = {
    id: '',
    companyName: '',
    companyStatus: 99,
  }
  if (userType === 3 && role !== 3) {
    const { userCompany } = await getUserCompany(id)

    if (userCompany) {
      companyInfo = {
        ...userCompany,
      }
    }
  }

  B3SStorage.set('companyStatus', companyInfo.companyStatus)

  return companyInfo
}

export const agentInfo = async (
  customerId: number,
  role: number,
  b3UserId: number | string,
  dispatch: any
) => {
  const isRelogin = sessionStorage.getItem('isReLogin') === 'true'

  if (+role === 3) {
    try {
      const data: any = await getAgentInfo(customerId)
      if (data?.superAdminMasquerading) {
        const { id, companyName } = data.superAdminMasquerading

        if (isRelogin) {
          B3SStorage.set('isAgenting', true)
          B3SStorage.set('salesRepCompanyId', id)
          B3SStorage.set('salesRepCompanyName', companyName)
          dispatch({
            type: 'common',
            payload: {
              isAgenting: true,
              salesRepCompanyId: id,
              salesRepCompanyName: companyName,
            },
          })
        }
      }
    } catch (error) {
      console.log(error)
    }
  }
}

export const getCompanyUserInfo = async (
  emailAddress: string,
  dispatch: DispatchProps,
  customerId: string | number,
  isB2BUser = false
) => {
  try {
    if (!emailAddress) return undefined

    const {
      companyUserInfo: {
        userType,
        userInfo: { role = '', id },
      },
    } = await getB2BCompanyUserInfo(emailAddress, customerId)

    if (isB2BUser) {
      B3SStorage.set('B3Role', role)

      dispatch({
        type: 'common',
        payload: {
          role,
        },
      })
    }

    return {
      userType,
      role,
      id,
    }
  } catch (error) {
    console.log(error)
  }
  return undefined
}

export const getCurrentCustomerInfo = async (dispatch: DispatchProps) => {
  try {
    const {
      data: { customer },
    } = await getCustomerInfo()

    if (!customer) return undefined

    const {
      entityId: customerId = '',
      phone: phoneNumber,
      firstName,
      lastName,
      email: emailAddress = '',
      customerGroupId,
    } = customer

    const companyUserInfo = await getCompanyUserInfo(
      emailAddress,
      dispatch,
      customerId
    )

    if (companyUserInfo && customerId) {
      const { userType, role, id } = companyUserInfo

      await getCurrentJwtAndB2BToken(userType)

      const [companyInfo] = await Promise.all([
        getCompanyInfo(id, userType, role),
        agentInfo(customerId, role, id, dispatch),
      ])

      const customerInfo = {
        phoneNumber,
        firstName,
        lastName,
        emailAddress,
        customerGroupId,
      }

      const isB2BUser =
        (userType === 3 && companyInfo?.companyStatus === 1) || +role === 3

      B3SStorage.set('B3CustomerInfo', customerInfo)
      B3SStorage.set('B3CompanyInfo', companyInfo)
      B3SStorage.set('B3CustomerId', customerId)
      B3SStorage.set('B3EmailAddress', emailAddress)
      B3SStorage.set('B3UserId', id)
      B3SStorage.set('B3Role', isB2BUser ? role : 99)
      B3SStorage.set('isB2BUser', isB2BUser)

      B3LStorage.set('MyQuoteInfo', {})
      B3LStorage.set('b2bQuoteDraftList', [])
      B3LStorage.set('quoteDraftUserId', id || customerId || 0)

      dispatch({
        type: 'common',
        payload: {
          isB2BUser,
          role: isB2BUser ? role : 99,
          customerId,
          B3UserId: id,
          companyInfo,
          customer: {
            phoneNumber,
            firstName,
            lastName,
            emailAddress,
          },
          emailAddress,
        },
      })

      return {
        role,
        userType,
      }
    }
  } catch (error) {
    console.log(error)
    clearCurrentCustomerInfo(dispatch)
  }
  return undefined
}

export const getSearchVal = (search: string, key: string) => {
  if (!search) {
    return ''
  }
  const searchParams = new URLSearchParams(search)

  return searchParams.get(key)
}
