import { getLocalizedUrl } from '@/lib/lang/getLocalizedUrl';
import { useAppSelector } from '@/store';

import { useFeatureFlag } from './useFeatureFlag';

export const useLocalizedUrl = (path: string): string => {
  const locales = useAppSelector(({ global }) => global.locales);
  const isProductTranslationEnabled = useFeatureFlag('LOCAL-3626.B2B_product_translation');

  return isProductTranslationEnabled ? getLocalizedUrl(path, locales) : path;
};
