import { useAppSelector } from '@/store';

import { useFeatureFlags } from './useFeatureFlags';

export const useIsBackorderValidationEnabled = (): boolean => {
  const featureFlags = useFeatureFlags();
  const backorderEnabled = useAppSelector(({ global }) => global.backorderEnabled);

  const isFeatureFlagEnabled =
    featureFlags['B2B-3318.move_stock_and_backorder_validation_to_backend'] ?? false;

  return isFeatureFlagEnabled && backorderEnabled;
};
