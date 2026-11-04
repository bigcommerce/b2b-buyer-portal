import type { SiteOrderStatus } from '@/shared/service/bc/graphql/orders';
import type { OrderStatusItem } from '@/types';

import { orderStatusTranslationVariables } from './getOrderStatus';
import {
  ORDER_STATUS_LEGACY_CODES,
  ORDER_STATUS_SYSTEM_LABELS,
  orderStatusValueToSystemLabel,
} from './orderStatusValue';

interface OrderStatusLabelContext {
  translations: Record<string, string>;
  localeMessages: Record<string, string>;
  enMessages: Record<string, string>;
  isDefaultLanguage: boolean;
}

export const resolveOrderStatusLabel = (
  status: SiteOrderStatus,
  { translations, localeMessages, enMessages, isDefaultLanguage }: OrderStatusLabelContext,
): string => {
  const systemLabel = orderStatusValueToSystemLabel(status.value);
  const messageKey = orderStatusTranslationVariables[systemLabel];
  const localeMessage = messageKey ? localeMessages[messageKey] : undefined;

  if (isDefaultLanguage) {
    const csvTranslation = (messageKey && translations[messageKey]) || translations[status.origin];

    return csvTranslation || status.origin || localeMessage || '';
  }

  const enPhrase = messageKey ? enMessages[messageKey] : undefined;
  const origin = status.origin !== enPhrase ? status.origin : undefined;

  return status.translation || origin || localeMessage || '';
};

export const toOrderStatusItems = (
  statuses: SiteOrderStatus[],
  context: OrderStatusLabelContext,
): OrderStatusItem[] =>
  statuses.map((status) => {
    const systemLabel = orderStatusValueToSystemLabel(status.value);

    return {
      systemLabel: systemLabel || status.origin,
      customLabel: resolveOrderStatusLabel(status, context),
      statusCode:
        ORDER_STATUS_LEGACY_CODES[status.value as keyof typeof ORDER_STATUS_SYSTEM_LABELS] ?? '',
    };
  });
