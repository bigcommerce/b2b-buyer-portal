import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { useIsBackorderEnabled } from '@/hooks/useIsBackorderEnabled';
import { useAppSelector } from '@/store';
import type { FeatureFlagKey } from '@/utils/featureFlags';

export const BACKORDER_STOREFRONT_MESSAGING_FEATURE_FLAG =
  'BACK-134.backorders_phase_1_1_control_messaging_on_storefront' satisfies FeatureFlagKey;

export function useBackorderStorefrontMessaging() {
  const isBackorderEnabled = useIsBackorderEnabled();
  const isBackorderMessagingEnabled = useFeatureFlag(BACKORDER_STOREFRONT_MESSAGING_FEATURE_FLAG);
  const { showQuantityOnBackorder, showQuantityOnHand, showBackorderMessage } = useAppSelector(
    ({ global }) => global.backorderDisplaySettings,
  );

  const isBackorderMessagingContextEnabled = isBackorderEnabled && isBackorderMessagingEnabled;

  const hasAnyBackorderDisplay =
    showQuantityOnBackorder || showQuantityOnHand || showBackorderMessage;

  return {
    isBackorderEnabled,
    isBackorderMessagingEnabled,
    isBackorderMessagingContextEnabled,
    hasAnyBackorderDisplay,
  };
}
