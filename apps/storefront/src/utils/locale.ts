import type { Locales } from '@/store/slices/global';

export const getActiveLocale = (locales: Locales) =>
  [...locales]
    .sort((a, b) => b.fullPath.length - a.fullPath.length)
    .find((l) => {
      const { href } = window.location;
      if (!href.startsWith(l.fullPath)) {
        return false;
      }
      const next = href[l.fullPath.length];
      return next === undefined || next === '/' || next === '#' || next === '?';
    });
