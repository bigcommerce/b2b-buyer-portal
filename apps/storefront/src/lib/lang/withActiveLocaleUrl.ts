import { store } from '@/store';

import { getActiveLocale } from './getActiveLocale';

/**
 * Prefix a canonical, locale-agnostic storefront path (e.g. a product `productUrl` returned by
 * `productsSearch`) with the shopper's active locale subfolder, so following it keeps them on the
 * locale they are currently browsing instead of dropping them back to the store's default
 * language.
 *
 * B2B GraphQL's `productUrl`/`path` is always the canonical path with no locale subfolder (that is
 * true regardless of the `Accept-Language` used to localize the product's `name`), so every
 * consumer that navigates to it must re-apply the subfolder itself; this is not something the
 * backend can generally do without knowing whether the requested locale is the channel default
 * (which has no subfolder at all).
 */
export const withActiveLocaleUrl = (path: string): string => {
  const { locales } = store.getState().global;
  const activeLocale = getActiveLocale(locales);

  if (!activeLocale || activeLocale.isDefault || !path) {
    return path;
  }

  let subfolder: string;

  try {
    subfolder = new URL(activeLocale.fullPath).pathname;
  } catch {
    return path;
  }

  subfolder = subfolder.replace(/\/$/, '');

  if (!subfolder || path.startsWith(subfolder)) {
    return path;
  }

  return `${subfolder}${path.startsWith('/') ? path : `/${path}`}`;
};
