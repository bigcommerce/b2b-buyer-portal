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
] as const;

export type FeatureFlagKey = (typeof featureFlags)[number]['key'];
export type FeatureFlags = Partial<{ [key in FeatureFlagKey]: boolean }>;
