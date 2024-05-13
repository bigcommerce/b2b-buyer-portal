import { channelId, storeHash } from '@/utils';

const getProxyInfo = (url: string, data = {}) => {
  const params = {
    storeHash,
    method: 'get',
    url,
    params: {},
    data: {
      channel_id: channelId,
      ...data,
    },
  };

  return params;
};
export default getProxyInfo;
