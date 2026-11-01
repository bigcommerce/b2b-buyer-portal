import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

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

  const activeLocale = getActiveLocale(locales);

  const { data } = useQuery({
    queryKey: ['siteOrderStatuses', activeLocale?.code],
    queryFn: getSiteOrderStatuses,
    enabled,
  });

  const localeCode = activeLocale?.code ?? 'en';
  const isDefaultLanguage = activeLocale?.isDefault !== false;
  const { ready, bundles } = useLocaleBundle(localeCode);
  const localeBundle = ready ? pickLocaleBundle(localeCode, bundles) : undefined;

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
