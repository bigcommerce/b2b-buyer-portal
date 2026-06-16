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

export function getNativeStorefrontPath(href: string, origin = window.location.origin): string | null {
  try {
    const url = new URL(href, origin);

    if (url.origin !== origin) {
      return null;
    }

    return `${url.pathname}${url.search}`;
  } catch (_error: unknown) {
    return null;
  }
}

export function isBuyerPortalNativeHref(href: string, origin = window.location.origin): boolean {
  const path = getNativeStorefrontPath(href, origin);

  if (!path) {
    return false;
  }

  return NATIVE_BUYER_PORTAL_PATHS.some((nativePath) => path === nativePath || path.startsWith(`${nativePath}?`));
}

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
