import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { getActiveLocale } from '@/lib/lang/getActiveLocale';
import { en } from '@/lib/lang/locales';
import { pickLocaleBundle } from '@/lib/lang/pickLocaleBundle';
import { useLocaleBundle } from '@/lib/lang/useLocaleBundle';
import { getSiteOrderStatuses } from '@/shared/service/bc/graphql/orders';
import { useAppSelector } from '@/store';
import type { OrderStatusItem } from '@/types';

import { toOrderStatusItems } from './shared/resolveOrderStatusLabel';

export function useOrderStatuses(enabled: boolean): OrderStatusItem[] {
  const translations = useAppSelector(({ lang }) => lang.translations);
  const locales = useAppSelector(({ global }) => global.locales);
  const isMultiLang = useFeatureFlag('LOCAL-3191.B2B_multi_language');

  const activeLocale = isMultiLang ? getActiveLocale(locales) : undefined;

  const { data } = useQuery({
    queryKey: ['siteOrderStatuses', activeLocale?.code],
    queryFn: getSiteOrderStatuses,
    enabled,
  });

  const localeCode = isMultiLang ? (activeLocale?.code ?? 'en') : 'en';
  const isDefaultLanguage = activeLocale?.isDefault !== false;
  const { ready, bundles } = useLocaleBundle(localeCode);
  const localeBundle = isMultiLang && ready ? pickLocaleBundle(localeCode, bundles) : undefined;

  return useMemo(
    () =>
      data
        ? toOrderStatusItems(data, {
            translations,
            localeMessages: { ...en, ...localeBundle },
            enMessages: en,
            isDefaultLanguage,
          })
        : [],
    [data, translations, localeBundle, isDefaultLanguage],
  );
}
