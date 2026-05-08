import type { Locales } from '@/store/slices/global';

import { getActiveLocale } from './getActiveLocale';

export const getActiveLocaleCode = (
  locales: Locales,
  href: string = window.location.href,
): string => getActiveLocale(locales, href)?.code ?? 'en';
