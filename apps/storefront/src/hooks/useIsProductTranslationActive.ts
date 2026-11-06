import { useLocation } from 'react-router-dom';

import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { getActiveLocale } from '@/lib/lang/getActiveLocale';
import { useAppSelector } from '@/store';

export const useIsProductTranslationActive = (): boolean => {
  const isProductTranslationEnabled = useFeatureFlag('LOCAL-3626.B2B_product_translation');
  const locales = useAppSelector(({ global }) => global.locales);

  // getActiveLocale reads window.location, so re-evaluate on every navigation
  useLocation();

  return isProductTranslationEnabled && getActiveLocale(locales)?.isDefault === false;
};
