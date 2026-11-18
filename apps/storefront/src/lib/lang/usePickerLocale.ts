import { useAppSelector } from '@/store';
import { getDayjsLocale } from '@/utils/b3DateFormat/setDayjsLocale';

import { getPickerLocaleText } from './pickerLocaleText';
import { resolvePickerLocale } from './resolvePickerLocale';

export const usePickerLocale = () => {
  const isEnabled = useAppSelector(
    ({ global }) => global.featureFlags['LOCAL-3509.Translate_b2b_dates'] ?? false,
  );
  const locales = useAppSelector(({ global }) => global.locales);

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
