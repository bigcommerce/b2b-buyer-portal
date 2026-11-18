import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { useAppSelector } from '@/store';
import { getDayjsLocale } from '@/utils/b3DateFormat/setDayjsLocale';

import { getActiveLocale } from './getActiveLocale';
import { getPickerLocaleText } from './pickerLocaleText';
import { resolvePickerLocale } from './resolvePickerLocale';

export const usePickerLocale = () => {
  const locales = useAppSelector(({ global }) => global.locales);
  const isFlagEnabled = useFeatureFlag('LOCAL-3509.Translate_b2b_dates');

  const isEnabled = isFlagEnabled && getActiveLocale(locales)?.isDefault === false;

  const adapterLocale = resolvePickerLocale({
    isEnabled,
    locales,
    fallbackLocale: getDayjsLocale(),
  });

  return {
    isLocalized: isEnabled,
    adapterLocale,
    localeText: isEnabled ? getPickerLocaleText(adapterLocale) : undefined,
  };
};
