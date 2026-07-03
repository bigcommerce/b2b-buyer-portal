interface InitOpenDecisionInput {
  pathname: string;
  hash: string;
  customerId?: number | string;
}

const NATIVE_BUYER_PORTAL_PATHS = ['/account.php', '/login.php'];

export function getClosestAnchorFromTarget(target: EventTarget | null): HTMLAnchorElement | null {
  if (!(target instanceof Element)) {
    return null;
  }

  return target.closest<HTMLAnchorElement>('a[href]');
}

export function getNativeStorefrontPath(
  href: string,
  origin = window.location.origin,
): string | null {
  try {
    const url = new URL(href, origin);

    if (url.origin !== origin) {
      return null;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch (_error: unknown) {
    return null;
  }
}

export function isBuyerPortalNativeHref(href: string, origin = window.location.origin): boolean {
  const path = getNativeStorefrontPath(href, origin);

  if (!path) {
    return false;
  }

  // Match on the pathname only (strip search/hash) so a locale prefix like
  // /en/account.php still matches, while a query string that happens to
  // contain "account.php" (e.g. /search.php?search_query=account.php) can't.
  const pathname = path.split(/[?#]/)[0];

  return NATIVE_BUYER_PORTAL_PATHS.some((nativePath) => pathname.endsWith(nativePath));
}

const NATIVE_LINK_INTERCEPTION_STORAGE_KEY = 'b2b-native-link-interception-enabled';

/*
  main.ts binds native-link interception before React mounts, when the
  LaunchDarkly-backed flag hasn't been fetched into Redux yet. We cache the
  last-known value here (set from storefrontConfig once configs load) so the
  next page load can read it back synchronously, mirroring the pattern used
  for the default-login-styling flag in preMountLoginMask.ts.

  TODO(B2B-4912): once buyer_portal_native_link_interception is fully rolled out
  and the flag is deleted, remove this caching bridge entirely, along with the
  setNativeLinkInterceptionEnabled call in storefrontConfig.ts and the
  isNativeLinkInterceptionCached read in main.ts.
*/
export const setNativeLinkInterceptionEnabled = (enabled: boolean) => {
  try {
    localStorage.setItem(NATIVE_LINK_INTERCEPTION_STORAGE_KEY, String(enabled));
  } catch {
    // ignore: persistence is best-effort
  }
};

export const isNativeLinkInterceptionCached = (): boolean => {
  try {
    return localStorage.getItem(NATIVE_LINK_INTERCEPTION_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
};

export function shouldOpenAllowedPageOnInit({
  pathname,
  hash,
  customerId,
}: InitOpenDecisionInput): boolean {
  if (pathname.includes('checkout')) {
    return false;
  }

  if (pathname.includes('account.php') && !hash) {
    return true;
  }

  return !(customerId && !hash);
}
