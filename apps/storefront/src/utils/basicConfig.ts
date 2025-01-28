export const {
  store_hash: storeHash,
  channel_id: channelId,
  disable_logout_button: disableLogoutButton,
  platform = 'custom',
} = window.B3.setting;

const { VITE_IS_LOCAL_ENVIRONMENT } = import.meta.env;

const generateBcStorefrontAPIBaseUrl = () => {
  if (VITE_IS_LOCAL_ENVIRONMENT === 'TRUE') return window.origin;
  if (platform === 'bigcommerce') return window.origin;
  if (channelId === 1) return `https://store-${storeHash}.mybigcommerce.com`;

  return `https://store-${storeHash}-${channelId}.mybigcommerce.com`;
};

export const BigCommerceStorefrontAPIBaseURL = generateBcStorefrontAPIBaseUrl();
