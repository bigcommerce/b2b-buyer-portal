import {
  getBCStoreChannelId,
  getBCToken,
  getB2BCompanyUserInfo,
  getB2BToken,
  getAgentInfo,
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
}

type B2BToken = {
  authorization: {
    result: {
      token: string
    }
  }
}

export interface ChannelstoreSites {
  storeSites?: Array<ChannelIdProps> | [],
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

export const getChannelId = async () => {
  const {
    storeBasicInfo,
  }: any = await getBCStoreChannelId()

  const channelId = getBCChannelId((storeBasicInfo as ChannelstoreSites)?.storeSites || [])

  B3SStorage.set('B3channelId', channelId)
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

    B3SStorage.set('bc_jwt_token', res)

    if (userType === 3) {
      const data = await getB2BToken(res)
      if (data) {
        const B3B2BToken: string = (data as B2BToken).authorization.result.token
        B3SStorage.set('B3B2BToken', B3B2BToken)
      }
    }
  } catch (error) {
    console.log(error)
  }
}

export const getCurrentCustomerInfo = async (dispatch: DispatchProps) => {
  try {
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

    if (customerId) {
      const customerInfo = {
        phoneNumber,
        firstName,
        lastName,
        emailAddress,
        customerGroupId,
      }
      // B3SStorage.set('emailAddress', emailAddress)
      B3SStorage.set('B3CustomerInfo', customerInfo)
      B3SStorage.set('B3CustomerId', customerId)
      B3SStorage.set('B3EmailAddress', emailAddress)
      B3SStorage.set('B3UserId', id)

      // B3Role = {
      //   ADMIN: '0',
      //   SENIOR: '1',
      //   JUNIOR: '2',
      //   SALESREP: '3',
      // }
      B3SStorage.set('B3Role', role)
      // B3SStorage.set('isAgenting', )
      B3SStorage.set('isB2BUser', userType === 3)

      let isAgenting = false
      let salesRepCompanyId = ''
      let salesRepCompanyName = ''

      if (role === 3) {
        try {
          const data: any = await getAgentInfo(customerId)
          if (data?.companyId) {
            B3SStorage.set('isAgenting', true)
            salesRepCompanyId = data.companyId
            salesRepCompanyName = data.companyName
            isAgenting = true
          }
        } catch (error) {
          console.log(error)
        }
      }

      dispatch({
        type: 'common',
        payload: {
          isB2BUser: userType === 3,
          role,
          customerId,
          B3UserId: id,
          isAgenting,
          salesRepCompanyId,
          salesRepCompanyName,
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
