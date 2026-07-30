import { useAppSelector } from '@/store';
import { isBigCommercePlatform } from '@/utils/basicConfig';
import type { FeatureFlagKey, FeatureFlags } from '@/utils/featureFlags';

/**
 * Returns whether a single storefront feature flag is enabled (true / false).
 */
export const useFeatureFlag = (flagKey: FeatureFlagKey): boolean =>
  useAppSelector(({ global }) => global.featureFlags[flagKey] ?? false);

/**
 * LD may enable a flag for all stores; these helpers gate whether the feature
 * is actually applied (Stencil only — headless stays on legacy flows).
 */
export const useShouldApplyFeatureFlagOnBigCommerce = (flagKey: FeatureFlagKey): boolean =>
  useFeatureFlag(flagKey) && isBigCommercePlatform();

export const shouldApplyFeatureFlagOnBigCommerce = (
  featureFlags: FeatureFlags,
  flagKey: FeatureFlagKey,
): boolean => (featureFlags[flagKey] ?? false) && isBigCommercePlatform();
