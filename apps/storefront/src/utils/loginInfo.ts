import { DispatchProps } from '@/shared/global/context/config'
import {
  getAgentInfo,
  getB2BCompanyUserInfo,
  getB2BToken,
  getBCGraphqlToken,
  getUserCompany,
} from '@/shared/service/b2b'
import { getCurrentCustomerJWT, getCustomerInfo } from '@/shared/service/bc'
import { B3LStorage, B3SStorage, storeHash } from '@/utils'

const { VITE_B2B_CLIENT_ID, VITE_LOCAL_DEBUG } = import.meta.env

interface ChannelIdProps {
  channelId: number
  urls: Array<string>
  b2bEnabled: boolean
  channelLogo: string
  b3ChannelId?: number
  type: string
  platform: string
  isEnabled: boolean
  translationVersion: number
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

export const getCurrentStoreInfo = (
  storeSites: Array<ChannelIdProps>,
  multiStorefrontEnabled: boolean
): ChannelIdProps | undefined => {
  const enabledStores =
    storeSites.filter((site: ChannelIdProps) => !!site.isEnabled) || []

  let store

  if (VITE_LOCAL_DEBUG) {
    store = {
      channelId: 1,
      urls: [],
      b2bEnabled: true,
      channelLogo: '',
      b3ChannelId: 16,
      type: 'storefront',
      platform: 'bigcommerce',
      isEnabled: true,
      translationVersion: 0,
    }
  }

  if (!multiStorefrontEnabled) {
    store = {
      channelId: 1,
      urls: [],
      b2bEnabled: true,
      channelLogo: '',
      b3ChannelId: 1,
      type: 'storefront',
      platform: 'bigcommerce',
      isEnabled: true,
      translationVersion: 0,
    }
  }

  const { origin } = window.location
  const cleanedOrigin = origin.replace('-1.', '.')
  const storeItem = enabledStores.find((item: ChannelIdProps) =>
    item.urls.map((url) => url.replace('-1.', '.')).includes(cleanedOrigin)
  )

  return storeItem || store
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
  } = await getBCGraphqlToken(loginTokenInfo)

  B3SStorage.set('bcGraphqlToken', token)
}

export const clearCurrentCustomerInfo = async (dispatch: DispatchProps) => {
  B3SStorage.set('B3CustomerInfo', {})
  B3SStorage.set('B3CustomerId', '')
  B3SStorage.set('B3EmailAddress', '')
  B3SStorage.set('B3Role', '')
  B3SStorage.set('isB2BUser', false)
  B3SStorage.set('B2BToken', false)
  B3SStorage.set('B3UserId', '')

  B3SStorage.set('salesRepCompanyName', '')
  B3SStorage.set('nextPath', '')
  B3SStorage.set('salesRepCompanyId', '')
  B3SStorage.set('salesRepCustomerGroupId', '')
  B3SStorage.set('isAgenting', '')

  B3SStorage.set('isShowBlockPendingAccountOrderCreationTip', {
    cartTip: 0,
    checkoutTip: 0,
  })
  B3SStorage.set('blockPendingAccountOrderCreation', false)
  B3SStorage.set('realRole', 100)
  B3SStorage.set('loginCustomer', '')
  B3SStorage.set('B3CompanyInfo', {
    id: '',
    companyName: '',
    companyStatus: '',
  })
  sessionStorage.removeItem('b2b-blockPendingAccountOrderCreation')

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

// companyStatus
// 99: default, Distinguish between bc and b2b
// 0: pending
// 1: approved
// 2: rejected
// 3: inactive
// 4: deleted

export const getCompanyInfo = async (
  id: number | string,
  role: number | string,
  userType = 3
) => {
  let companyInfo = {
    id: '',
    companyName: '',
    companyStatus: 99,
  }
  const realRole =
    B3SStorage.get('realRole') === 0 ? 0 : B3SStorage.get('realRole') || role

  const B2BToken = B3SStorage.get('B2BToken')
  const roles = [0, 1, 2]
  if (!B2BToken || !roles.includes(+realRole)) return companyInfo

  if (userType === 3 && +realRole !== 3) {
    const { userCompany } = await getUserCompany(+id)

    if (userCompany) {
      companyInfo = {
        ...userCompany,
      }
    }
  }

  B3SStorage.set('companyStatus', companyInfo.companyStatus)

  const blockPendingAccountOrderCreation = B3SStorage.get(
    'blockPendingAccountOrderCreation'
  )
  const noNewSFPlaceOrders =
    blockPendingAccountOrderCreation && companyInfo.companyStatus === 0
  if (noNewSFPlaceOrders) {
    sessionStorage.setItem(
      'b2b-blockPendingAccountOrderCreation',
      JSON.stringify(noNewSFPlaceOrders)
    )
  } else {
    sessionStorage.removeItem('b2b-blockPendingAccountOrderCreation')
  }

  return companyInfo
}

export const agentInfo = async (
  customerId: number | string,
  role: number,
  b3UserId: number | string,
  dispatch: any
) => {
  if (+role === 3) {
    try {
      const data: any = await getAgentInfo(customerId)
      if (data?.superAdminMasquerading) {
        const {
          id,
          companyName,
          customerGroupId = 0,
        } = data.superAdminMasquerading

        B3SStorage.set('isAgenting', true)
        B3SStorage.set('salesRepCompanyId', id)
        B3SStorage.set('salesRepCompanyName', companyName)
        B3SStorage.set('salesRepCustomerGroupId', customerGroupId)
        dispatch({
          type: 'common',
          payload: {
            isAgenting: true,
            salesRepCompanyId: id,
            salesRepCompanyName: companyName,
            salesRepCustomerGroupId: customerGroupId,
          },
        })
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
    if (!emailAddress || !customerId) return undefined

    const {
      companyUserInfo: {
        userType,
        userInfo: { role = '', id },
      },
    } = await getB2BCompanyUserInfo(emailAddress, customerId)

    B3SStorage.set('realRole', role)
    dispatch({
      type: 'common',
      payload: {
        realRole: role,
      },
    })

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

const loginWithCurrentCustomerJWT = async () => {
  const channelId = B3SStorage.get('B3channelId')
  const prevCurrentCustomerJWT = B3SStorage.get('currentCustomerJWT')
  const currentCustomerJWT = await getCurrentCustomerJWT({
    app_client_id: VITE_B2B_CLIENT_ID,
  })

  if (
    currentCustomerJWT.includes('errors') ||
    prevCurrentCustomerJWT === currentCustomerJWT
  )
    return undefined

  B3SStorage.set('currentCustomerJWT', currentCustomerJWT)
  const data = await getB2BToken(currentCustomerJWT, channelId)
  const B2BToken = data.authorization.result.token
  B3SStorage.set('B2BToken', B2BToken)

  return B2BToken
}

export const getCurrentCustomerInfo = async (
  dispatch: DispatchProps,
  b2bToken?: string
) => {
  if (!(b2bToken || B3LStorage.get('B2BToken'))) {
    if (!(await loginWithCurrentCustomerJWT())) {
      return undefined
    }
  }
  try {
    const data = await getCustomerInfo()

    if (data?.detail) return undefined

    const loginCustomer = data.data.customer

    const {
      entityId: customerId = '',
      phone: phoneNumber,
      firstName,
      lastName,
      email: emailAddress = '',
      customerGroupId,
    } = loginCustomer

    const companyUserInfo = await getCompanyUserInfo(
      emailAddress,
      dispatch,
      customerId
    )

    if (companyUserInfo && customerId) {
      const { userType, role, id } = companyUserInfo

      const [companyInfo] = await Promise.all([
        getCompanyInfo(id, role, userType),
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
      B3LStorage.set('cartToQuoteId', '')

      dispatch({
        type: 'common',
        payload: {
          isB2BUser,
          role: isB2BUser ? role : 99,
          realRole: role,
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
