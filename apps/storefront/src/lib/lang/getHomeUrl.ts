import type { Locales } from '@/store/slices/global';

import { getActiveLocale } from './getActiveLocale';

export const getHomeUrl = (locales: Locales): string => {
  const activeLocale = getActiveLocale(locales) ?? locales.find((locale) => locale.isDefault);
  return activeLocale?.fullPath || '/';
};
