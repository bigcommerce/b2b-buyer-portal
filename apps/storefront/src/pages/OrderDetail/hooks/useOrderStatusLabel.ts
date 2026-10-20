import { useContext } from 'react';

import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { useB3Lang } from '@/lib/lang';
import { getActiveLocale } from '@/lib/lang/getActiveLocale';
import { useAppSelector } from '@/store';
import { OrderStatusItem } from '@/types';

import { orderStatusTranslationVariables } from '../../order/shared/getOrderStatus';
import { systemLabelToOrderStatusValue } from '../../order/shared/orderStatusValue';
import { resolveOrderStatusLabel } from '../../order/shared/resolveOrderStatusLabel';
import { OrderDetailsContext } from '../context/OrderDetailsContext';

export const useShouldResolveOrderStatusLabels = () => {
  const isUnifiedOrders = useFeatureFlag('B2B-4613.buyer_portal_unified_sf_gql_orders');
  const isTranslatedOrderStatuses = useFeatureFlag(
    'LOCAL-3680.B2B_display_translated_order_statuses',
  );

  return isUnifiedOrders && isTranslatedOrderStatuses;
};

export const useOrderStatusLabel = () => {
  const b3Lang = useB3Lang();

  const locales = useAppSelector(({ global }) => global.locales);
  const translations = useAppSelector(({ lang }) => lang.translations);
  const isDefaultLocale = getActiveLocale(locales)?.isDefault ?? true;

  const {
    state: { status: currentStatus, customStatus, orderStatus = [] },
  } = useContext(OrderDetailsContext);

  const shouldResolveStatusLabels = useShouldResolveOrderStatusLabels();

  return (status: string): string => {
    if (shouldResolveStatusLabels) {
      return resolveOrderStatusLabel({
        isDefaultLocale,
        translations,
        label: status === currentStatus && customStatus ? customStatus : status,
        value: systemLabelToOrderStatusValue(status),
      });
    }

    const currentOrderStatus = orderStatus.find(
      (item: OrderStatusItem) => item.systemLabel === status,
    );

    let activeStatusLabel = currentOrderStatus?.customLabel || customStatus;

    if (currentOrderStatus) {
      const optionLabel = orderStatusTranslationVariables[currentOrderStatus.systemLabel];

      activeStatusLabel =
        optionLabel && b3Lang(optionLabel) !== currentOrderStatus.systemLabel
          ? b3Lang(optionLabel)
          : activeStatusLabel;
    }

    return activeStatusLabel ?? '';
  };
};
