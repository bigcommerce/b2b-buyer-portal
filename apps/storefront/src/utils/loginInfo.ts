import {
  getBCToken,
  getB2BCompanyUserInfo,
  getB2BToken,
  getAgentInfo,
  getUserCompany,
  getCurrencies,
} from '@/shared/service/b2b'

import {
  getCustomerInfo,
  getBcCurrentJWT,
} from '@/shared/service/bc'

import {
  B3SStorage,
  storeHash,
} from '@/utils'

import {
  DispatchProps,
} from '@/shared/global/context/config'

interface ChannelIdProps {
  channelId: number,
  urls: Array<string>,
  b2bEnabled: boolean,
  channelLogo: string,
  b3ChannelId?: number,
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
  storeSites?: Array<ChannelIdProps> | [],
}

export const getCurrentStoreInfo = (storeSites: Array<ChannelIdProps>) => {
  if (storeSites.length === 1) {
    return storeSites[0]
  }

  let store: ChannelIdProps = {
    channelId: 1,
    urls: [],
    b2bEnabled: true,
    channelLogo: '',
    b3ChannelId: 16,
  }

  const {
    origin,
  } = window.location

  storeSites.forEach((item: ChannelIdProps) => {
    if (item.urls.includes(origin)) {
      store = item
    }
  })

  return store
}

export const getloginTokenInfo = (channelId: number) => {
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

export const loginInfo = async () => {
  const channelId = B3SStorage.get('B3channelId')
  const loginTokenInfo = getloginTokenInfo(channelId)
  const {
    data: {
      token,
    },
  } = await getBCToken(loginTokenInfo)

  B3SStorage.set('BcToken', token)
}

export const getCurrenciesInfo = async (dispatch: DispatchProps) => {
  const channelId = B3SStorage.get('B3channelId')

  const {
    currencies,
  } = await getCurrencies(channelId)

  dispatch({
    type: 'common',
    payload: {
      currencies,
    },
  })

  B3SStorage.set('currencies', currencies)
}

export const clearCurrentCustomerInfo = async (dispatch: DispatchProps) => {
  B3SStorage.set('B3CustomerInfo', {})
  B3SStorage.set('B3CustomerId', '')
  B3SStorage.set('B3EmailAddress', '')
  B3SStorage.set('B3Role', '')
  B3SStorage.set('isB2BUser', false)
  B3SStorage.set('bc_jwt_token', false)
  B3SStorage.set('B3B2BToken', false)
  B3SStorage.set('B3UserId', '')

  dispatch({
    type: 'common',
    payload: {
      isB2BUser: false,
      role: '',
      customerId: '',
      customer: {
        phoneNumber: '',
        firstName: '',
        lastName: '',
        emailAddress: '',
      },
      emailAddress: '',
    },
  })
}

export const getCurrentJwt = async () => {
  try {
    const res = await getBcCurrentJWT({
      app_client_id: 'r2x8j3tn54wduq47b4efct5tqxio5z2',
    })

    B3SStorage.set('bc_jwt_token', res)
    return res
  } catch (error) {
    console.log(error)
  }
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

const getCompanyInfo = async (id: number, userType: number, role:number) => {
  let companyInfo = {
    id: '',
    companyName: '',
    companyStatus: '',
  }
  if (userType === 3 && role !== 3) {
    const {
      userCompany,
    } = await getUserCompany(id)

    if (userCompany) {
      companyInfo = {
        ...userCompany,
      }
    }
  }

  return companyInfo
}

export const getCurrentAgentInfo = async (customerId: number, role: number) => {
  let isAgenting = false
  let salesRepCompanyId = ''
  let salesRepCompanyName = ''

  if (+role === 3) {
    try {
      const data: any = await getAgentInfo(customerId)
      if (data?.superAdminMasquerading) {
        const {
          id,
          companyName,
        } = data.superAdminMasquerading
        B3SStorage.set('isAgenting', true)
        B3SStorage.set('salesRepCompanyId', id)
        B3SStorage.set('salesRepCompanyName', companyName)
        salesRepCompanyId = id
        salesRepCompanyName = companyName
        isAgenting = true
      }
    } catch (error) {
      console.log(error)
    }
  }

  return {
    isAgenting,
    salesRepCompanyId,
    salesRepCompanyName,
  }
}

export const getCurrentCustomerInfo = async (dispatch: DispatchProps) => {
  try {
    await getCurrenciesInfo(dispatch)

    const {
      data: {
        customer,
      },
    } = await getCustomerInfo()

    if (!customer) return

    const {
      entityId: customerId,
      phone: phoneNumber,
      firstName,
      lastName,
      email: emailAddress = '',
      customerGroupId,
    } = customer

    const {
      companyUserInfo: {
        userType,
        userInfo: {
          role = '',
          id,
        },
      },
    } = await getB2BCompanyUserInfo(emailAddress)

    await getCurrentJwtAndB2BToken(userType)

    const companyInfo = await getCompanyInfo(id, userType, role)

    if (customerId) {
      const agentInfo = await getCurrentAgentInfo(customerId, role)
      const customerInfo = {
        phoneNumber,
        firstName,
        lastName,
        emailAddress,
        customerGroupId,
      }
      B3SStorage.set('B3CustomerInfo', customerInfo)
      B3SStorage.set('B3CompanyInfo', companyInfo)
      B3SStorage.set('B3CustomerId', customerId)
      B3SStorage.set('B3EmailAddress', emailAddress)
      B3SStorage.set('B3UserId', id)
      B3SStorage.set('B3Role', userType === 3 ? role : 99)
      B3SStorage.set('isB2BUser', userType === 3)

      dispatch({
        type: 'common',
        payload: {
          isB2BUser: userType === 3,
          role: userType === 3 ? role : 99,
          customerId,
          B3UserId: id,
          isAgenting: agentInfo.isAgenting,
          salesRepCompanyId: agentInfo.salesRepCompanyId,
          salesRepCompanyName: agentInfo.salesRepCompanyName,
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
    }

    return {
      role,
      userType,
    }
  } catch (error) {
    console.log(error)
    clearCurrentCustomerInfo(dispatch)
  }
}

export const getSearchVal = (search:string, key:string) => {
  if (!search) {
    return ''
  }
  const searchParams = new URLSearchParams(search)

  return searchParams.get(key)
}
