import { useEffect, useMemo } from 'react';

import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { useB3Lang } from '@/lib/lang';
import { getActiveLocale } from '@/lib/lang/getActiveLocale';
import { useAppSelector } from '@/store';

export const useNameSortDisabledReason = (
  orderBy: string,
  nameSortKey: string,
  resetSort: () => void,
): string | undefined => {
  const b3Lang = useB3Lang();
  const isProductTranslationEnabled = useFeatureFlag('LOCAL-3626.B2B_product_translation');
  const locales = useAppSelector(({ global }) => global.locales);
  // Switching storefront locale is a full page navigation, so the URL is stable for the component's lifetime.
  const activeLocale = useMemo(() => getActiveLocale(locales), [locales]);
  const isNameSortUnavailable = isProductTranslationEnabled && activeLocale?.isDefault === false;

  useEffect(() => {
    if (isNameSortUnavailable && orderBy === nameSortKey) {
      resetSort();
    }
  }, [isNameSortUnavailable, orderBy, nameSortKey, resetSort]);

  return isNameSortUnavailable ? b3Lang('table.sortByNameUnavailable') : undefined;
};
