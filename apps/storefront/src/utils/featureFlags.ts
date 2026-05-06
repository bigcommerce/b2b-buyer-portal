export const featureFlags = [
  {
    key: 'B2B-3817.disable_masquerading_cleanup_on_login',
    name: 'disableMasqueradingCleanupOnLogin',
  },
  {
    key: 'B2B-3474.get_sku_from_pdp_with_text_content',
    name: 'getSkuFromPdpWithTextContent',
  },
  {
    key: 'B2B-3978.pass_with_modifiers_to_product_upload',
    name: 'passWithModifiersToProductUpload',
  },
  {
    key: 'B2B-4231.chunk_product_searches_in_csv_upload',
    name: 'chunkProductSearchesInCsvUpload',
  },
  {
    key: 'B2B-3705.increase_graphql_limits_inline_with_platform_api',
    name: 'increaseGraphQLLimitsInlineWithPlatformApi',
  },
  {
    key: 'BACK-134.backorders_phase_1_1_control_messaging_on_storefront',
    name: 'backordersPhase1_1ControlMessagingOnStorefront',
  },
  {
    key: 'B2B-4466.use_register_company_flow',
    name: 'useRegisterCompanyFlow',
  },
  {
    key: 'B2B-4613.buyer_portal_unified_sf_gql_orders',
    name: 'unifiedStorefrontGraphqlOrders',
  },
] as const;

export type FeatureFlagKey = (typeof featureFlags)[number]['key'];
export type FeatureFlags = Partial<{ [key in FeatureFlagKey]: boolean }>;
