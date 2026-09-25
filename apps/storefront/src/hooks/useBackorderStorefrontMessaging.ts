import { useIsBackorderEnabled } from '@/hooks/useIsBackorderEnabled';
import { useAppSelector } from '@/store';

export function useBackorderStorefrontMessaging() {
  const isBackorderEnabled = useIsBackorderEnabled();
  const { showQuantityOnBackorder, showQuantityOnHand, showBackorderMessage } = useAppSelector(
    ({ global }) => global.backorderDisplaySettings,
  );

  const hasAnyBackorderDisplay =
    showQuantityOnBackorder || showQuantityOnHand || showBackorderMessage;

  return {
    isBackorderEnabled,
    hasAnyBackorderDisplay,
  };
}
