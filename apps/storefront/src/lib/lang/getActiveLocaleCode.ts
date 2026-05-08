import type { Locale, Locales } from '@/store/slices/global';

export const getActiveLocale = (
  locales: Locales,
  href: string = window.location.href,
): Locale | undefined =>
  [...locales]
    .sort((a, b) => b.fullPath.length - a.fullPath.length)
    .find((l) => {
      if (!href.startsWith(l.fullPath)) {
        return false;
      }
      const next = href[l.fullPath.length];
      return next === undefined || next === '/' || next === '#' || next === '?';
    });

export const getActiveLocaleCode = (
  locales: Locales,
  href: string = window.location.href,
): string => {
  const active = getActiveLocale(locales, href);
  if (active) {
    return active.code;
  }
  const fallback = locales.find((l) => l.isDefault);
  if (fallback) {
    return fallback.code;
  }
  return 'en';
};
