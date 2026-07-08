export const PLATFORM_BIGCOMMERCE = 'bigcommerce' as const;
export const PLATFORM_CATALYST = 'catalyst' as const;

export const {
  store_hash: storeHash,
  channel_id: channelId,
  disable_logout_button: disableLogoutButton,
  platform = 'custom',
  bc_graphql_domain: bcGraphqlDomain = 'mybigcommerce.com',
} = window.B3.setting;

const generateBcStorefrontAPIBaseUrl = () => {
  if (platform === PLATFORM_BIGCOMMERCE) return window.origin;
  if (channelId === 1) return `https://store-${storeHash}.${bcGraphqlDomain}`;

  return `https://store-${storeHash}-${channelId}.${bcGraphqlDomain}`;
};

export const BigCommerceStorefrontAPIBaseURL = generateBcStorefrontAPIBaseUrl();

/** True for storefronts that talk directly to the BC Storefront GraphQL API: Stencil ('bigcommerce') and Catalyst ('catalyst'). */
export const isBcStorefrontPlatform =
  platform === PLATFORM_BIGCOMMERCE || platform === PLATFORM_CATALYST;
