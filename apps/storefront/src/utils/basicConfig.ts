export const {
  store_hash: storeHash,
  channel_id: channelId,
  platform,
} = window.B3.setting

const { VITE_LOCAL_DEBUG } = import.meta.env

const generateBcUrl = () => {
  if (VITE_LOCAL_DEBUG === 'TRUE') return '/bigcommerce'
  if (platform === 'bigcommerce') return window.origin
  if (channelId === 1) return `https://store-${storeHash}.mybigcommerce.com`

  return `https://store-${storeHash}-${channelId}.mybigcommerce.com`
}

export const baseUrl = generateBcUrl()
