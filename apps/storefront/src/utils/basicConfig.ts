export const {
  store_hash: storeHash,
  channel_id: channelId,
  disable_logout_button: disableLogoutButton,
  platform = 'custom',
  bc_graphql_domain: bcGraphqlDomain = 'mybigcommerce.com',
} = window.B3.setting;

const generateBcStorefrontAPIBaseUrl = () => {
  if (platform === 'bigcommerce') return window.origin;
  if (channelId === 1) return `https://store-${storeHash}.${bcGraphqlDomain}`;

  return `https://store-${storeHash}-${channelId}.${bcGraphqlDomain}`;
};

export const BigCommerceStorefrontAPIBaseURL = generateBcStorefrontAPIBaseUrl();
