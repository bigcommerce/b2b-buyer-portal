import { PLATFORM } from '@/constants/platform';

export const {
  store_hash: storeHash,
  channel_id: channelId,
  disable_logout_button: disableLogoutButton,
  platform = PLATFORM.CUSTOM,
} = window.B3.setting;

export const isBigCommercePlatform = (value: string = platform) => value === PLATFORM.BIGCOMMERCE;

export const isCatalystPlatform = (value: string = platform) => value === PLATFORM.CATALYST;

const generateBcStorefrontAPIBaseUrl = () => {
  if (isBigCommercePlatform()) return window.origin;
  if (channelId === 1) return `https://store-${storeHash}.mybigcommerce.com`;

  return `https://store-${storeHash}-${channelId}.mybigcommerce.com`;
};

export const BigCommerceStorefrontAPIBaseURL = generateBcStorefrontAPIBaseUrl();
