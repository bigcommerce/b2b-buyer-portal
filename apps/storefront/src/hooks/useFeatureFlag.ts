import { useAppSelector } from '@/store';
import type { FeatureFlagKey } from '@/utils/featureFlags';

function isFeatureFlagOverrideMap(value: unknown): value is Partial<Record<FeatureFlagKey, boolean>> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function getLocalFeatureFlagOverride(flagKey: FeatureFlagKey): boolean | undefined {
  if (
    !import.meta.env.DEV ||
    import.meta.env.VITEST === 'true' ||
    !import.meta.env.VITE_FEATURE_FLAG_OVERRIDES
  ) {
    return undefined;
  }

  try {
    const parsedOverrides: unknown = JSON.parse(import.meta.env.VITE_FEATURE_FLAG_OVERRIDES);

    if (!isFeatureFlagOverrideMap(parsedOverrides)) {
      return undefined;
    }

    const override = parsedOverrides[flagKey];

    return typeof override === 'boolean' ? override : undefined;
  } catch (_error: unknown) {
    return undefined;
  }
}

/**
 * Returns whether a single storefront feature flag is enabled (true / false).
 */
export const useFeatureFlag = (flagKey: FeatureFlagKey): boolean =>
  useAppSelector(({ global }) => getLocalFeatureFlagOverride(flagKey) ?? global.featureFlags[flagKey] ?? false);
