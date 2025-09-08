export const featureFlags = [
  {
    key: 'B2B-3318.move_stock_and_backorder_validation_to_backend',
    name: 'moveStockAndBackorderValidationToBackend',
  },
] as const;

export type FeatureFlagKey = (typeof featureFlags)[number]['key'];
export type FeatureFlags = { [key in FeatureFlagKey]: boolean } | Record<string, never>;
