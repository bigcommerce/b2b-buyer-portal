import type { SiteOrderStatus } from '@/shared/service/bc/graphql/orders';
import type { OrderStatusItem } from '@/types';

import { orderStatusTranslationVariables } from './getOrderStatus';
import { orderStatusIdToSystemLabel } from './orderStatusValue';

interface OrderStatusLabelContext {
  enMessages: Record<string, string>;
  isDefaultLanguage: boolean;
  localeMessages: Record<string, string>;
  translations: Record<string, string>;
}

export const resolveOrderStatusLabel = (
  status: SiteOrderStatus,
  { enMessages, isDefaultLanguage, localeMessages, translations }: OrderStatusLabelContext,
): string => {
  const messageKey = orderStatusTranslationVariables[orderStatusIdToSystemLabel(status.id)];
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
    const systemLabel = orderStatusIdToSystemLabel(status.id);

    return {
      systemLabel: systemLabel || status.origin,
      customLabel: resolveOrderStatusLabel(status, context),
      statusCode: String(status.id),
    };
  });
