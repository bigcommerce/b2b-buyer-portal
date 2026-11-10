import { useMemo } from 'react';

import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { getActiveLocale } from '@/lib/lang/getActiveLocale';
import { useAppSelector } from '@/store';

export const useIsProductTranslationActive = (): boolean => {
  const isProductTranslationEnabled = useFeatureFlag('LOCAL-3626.B2B_product_translation');
  const locales = useAppSelector(({ global }) => global.locales);
  // Switching storefront locale is a full page navigation, so the URL is stable for the component's lifetime.
  const activeLocale = useMemo(() => getActiveLocale(locales), [locales]);

  return isProductTranslationEnabled && activeLocale?.isDefault === false;
};
