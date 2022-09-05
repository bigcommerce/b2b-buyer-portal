import {
  getBCStoreChannelId,
  getBCToken,
  getB2BCompanyUserInfo,
} from '@/shared/service/b2b'

import {
  getCustomerInfo,
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
  B3SStorage.set('B3Role', 0)
  B3SStorage.set('isB2BUser', false)

  dispatch({
    type: 'common',
    payload: {
      isB2BUser: false,
      role: 0,
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
    } = customer

    const {
      companyUserInfo: {
        userType,
        userInfo: {
          role,
        },
      },
    } = await getB2BCompanyUserInfo(emailAddress)

    if (customerId) {
      const customerInfo = {
        phoneNumber,
        firstName,
        lastName,
        emailAddress,
      }
      // B3SStorage.set('emailAddress', emailAddress)
      B3SStorage.set('B3CustomerInfo', customerInfo)
      B3SStorage.set('B3CustomerId', customerId)
      B3SStorage.set('B3EmailAddress', emailAddress)
      B3SStorage.set('B3Role', role)
      B3SStorage.set('isB2BUser', userType === 3)

      dispatch({
        type: 'common',
        payload: {
          isB2BUser: userType === 3,
          role,
          customerId,
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
    // eslint-disable-next-line no-console
    console.log(error)
    clearCurrentCustomerInfo(dispatch)
  }
}
