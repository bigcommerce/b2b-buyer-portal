import { useQuery } from '@tanstack/react-query';

import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { useAppSelector } from '@/store';
import { getDayjsLocale } from '@/utils/b3DateFormat/setDayjsLocale';

import { getActiveLocale } from './getActiveLocale';
import { loadPickerLocale } from './loadPickerLocale';
import { resolvePickerLocale } from './resolvePickerLocale';

export const usePickerLocale = () => {
  const isFlagEnabled = useFeatureFlag('LOCAL-3509.Translate_b2b_dates');
  const locales = useAppSelector(({ global }) => global.locales);

  const fallbackLocale = getDayjsLocale();
  const isEnabled = isFlagEnabled && getActiveLocale(locales)?.isDefault === false;
  const pickerLocale = resolvePickerLocale({ isEnabled, locales, fallbackLocale });

  const { data } = useQuery({
    queryKey: ['pickerLocale', pickerLocale],
    queryFn: async () => ({ localeText: await loadPickerLocale(pickerLocale) }),
    enabled: isEnabled,
    staleTime: Infinity,
  });

  if (!isEnabled || !data) {
    return { isLocalized: false, adapterLocale: fallbackLocale, localeText: undefined };
  }

  return { isLocalized: true, adapterLocale: pickerLocale, localeText: data.localeText };
};
