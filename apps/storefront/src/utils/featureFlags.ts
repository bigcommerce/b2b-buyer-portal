export const featureFlags = [
  {
    key: 'B2B-3817.disable_masquerading_cleanup_on_login',
    name: 'disableMasqueradingCleanupOnLogin',
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
  {
    key: 'LOCAL-3191.B2B_multi_language',
    name: 'b2bMultiLanguage',
  },
  {
    key: 'B2B-3876.fix_quote_currency_symbol_placement',
    name: 'fixQuoteCurrencySymbolPlacement',
  },
  {
    key: 'PROJECT-7920.use_bc_account_settings',
    name: 'useBcAccountSettings',
  },
  {
    key: 'PROJECT-7920.use_bc_login_and_authorisation',
    name: 'useBcLoginAndAuthorisation',
  },
  {
    key: 'B2B-4870.default_buyer_portal_styling_on_login_page',
    name: 'defaultBuyerPortalStylingOnLoginPage',
  },
  {
    key: 'B2B-4089.use_tbd_price_on_quotes_list',
    name: 'useTbdPriceOnQuotesList',
  },
  {
    key: 'BACK-593.surface_order_backorder_info_on_quotes',
    name: 'surfaceOrderBackorderInfoOnQuotes',
  },
  {
    key: 'B2B-4912.buyer_portal_native_link_interception',
    name: 'buyerPortalNativeLinkInterception',
  },
] as const;

export type FeatureFlagKey = (typeof featureFlags)[number]['key'];
export type FeatureFlags = Partial<{ [key in FeatureFlagKey]: boolean }>;
