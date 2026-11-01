import type { SiteOrderStatus } from '@/shared/service/bc/graphql/orders';
import type { OrderStatusItem } from '@/types';

import { orderStatusTranslationVariables } from './getOrderStatus';
import { orderStatusIdToSystemLabel } from './orderStatusValue';

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
  const systemLabel = orderStatusIdToSystemLabel(status.value);
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
    const systemLabel = orderStatusIdToSystemLabel(status.value);

    return {
      systemLabel: systemLabel || status.origin,
      customLabel: resolveOrderStatusLabel(status, context),
      statusCode: String(status.value),
    };
  });
