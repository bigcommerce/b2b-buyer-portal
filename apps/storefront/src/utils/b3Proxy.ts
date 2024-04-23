import { storeHash } from '@/utils'

import { B3SStorage } from './b3Storage'

const getProxyInfo = (url: string, data = {}) => {
  const params = {
    storeHash,
    method: 'get',
    url,
    params: {},
    data: {
      channel_id: B3SStorage.get('B3channelId') || 1,
      ...data,
    },
  }

  return params
}
export default getProxyInfo
