export const featureFlags = [
  {
    key: 'B2B-3318.move_stock_and_backorder_validation_to_backend',
    name: 'moveStockAndBackorderValidationToBackend',
  },
  {
    key: 'B2B-3817.disable_masquerading_cleanup_on_login',
    name: 'disableMasqueradingCleanupOnLogin',
  },
  {
    key: 'B2B-3857.move_tax_display_settings_to_bc_storefront_graph',
    name: 'moveTaxDisplaySettingsToBCStorefrontGraph',
  },
  {
    key: 'B2B-3474.get_sku_from_pdp_with_text_content',
    name: 'getSkuFromPdpWithTextContent',
  },
] as const;

export type FeatureFlagKey = (typeof featureFlags)[number]['key'];
export type FeatureFlags = Partial<{ [key in FeatureFlagKey]: boolean }>;
