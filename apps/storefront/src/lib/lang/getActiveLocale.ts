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
      if (l.fullPath.endsWith('/')) {
        return true;
      }
      const next = href[l.fullPath.length];
      return next === undefined || next === '/' || next === '#' || next === '?';
    });
