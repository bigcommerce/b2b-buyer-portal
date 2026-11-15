import type { Locales } from '@/store/slices/global';

import { getActiveLocale } from './getActiveLocale';

const ABSOLUTE_URL = /^([a-z][a-z0-9+.-]*:)?\/\//i;

export const getLocalizedUrl = (path: string, locales: Locales): string => {
  if (ABSOLUTE_URL.test(path)) {
    return path;
  }

  const activeLocale = getActiveLocale(locales);

  return activeLocale
    ? `${activeLocale.fullPath.replace(/\/+$/, '')}${path.startsWith('/') ? '' : '/'}${path}`
    : path;
};
