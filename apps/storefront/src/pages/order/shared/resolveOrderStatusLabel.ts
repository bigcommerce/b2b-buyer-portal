import { orderStatusTranslationVariables } from './getOrderStatus';
import { orderStatusValueToSystemLabel } from './orderStatusValue';

interface ResolveOrderStatusLabelArgs {
  isDefaultLocale: boolean;
  label: string;
  translations: Record<string, string>;
  value: string | null | undefined;
}

export const resolveOrderStatusLabel = ({
  isDefaultLocale,
  label,
  translations,
  value,
}: ResolveOrderStatusLabelArgs): string => {
  if (!isDefaultLocale) {
    return label;
  }

  const key = orderStatusTranslationVariables[orderStatusValueToSystemLabel(value)];

  return (key && translations[key]) || label;
};
