import { useAppSelector } from '@/store';
import type { FeatureFlagKey } from '@/utils/featureFlags';

/**
 * Returns whether a single storefront feature flag is enabled (true / false).
 */
export const useFeatureFlag = (flagKey: FeatureFlagKey): boolean =>
  useAppSelector(({ global }) => global.featureFlags[flagKey] ?? false);
