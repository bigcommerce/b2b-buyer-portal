import type { Locale, Locales } from '@/store/slices/global';

export const getActiveLocale = (locales: Locales): Locale | undefined =>
  locales
    .map((locale) => ({ locale, fullPath: locale.fullPath.replace(/\/$/, '') }))
    .sort((a, b) => b.fullPath.length - a.fullPath.length)
    .find(({ fullPath }) => {
      const { href } = window.location;
      if (!href.startsWith(fullPath)) {
        return false;
      }
      const next = href[fullPath.length];
      return next === undefined || next === '/' || next === '#' || next === '?';
    })?.locale;
