/*
  localStorage bridge for the B2B-5366.prevent_premature_orders_redirect
  feature flag.

  App's init effect must read this flag once, at mount, into a ref instead of
  subscribing to it reactively: the flag lives in StoreConfig and is only
  populated (asynchronously, by getStoreConfigs) from inside the very init
  call it's meant to gate. A reactive read let a mid-flight flag load
  retrigger the effect into the other branch while the first branch's call
  was still in flight, running legacyInitializeApp and initializeApp
  concurrently for the same session.

  Caching the resolved value here lets the next page load read a stable
  snapshot before StoreConfig is fetched again, so the branch decision can no
  longer change mid-session. On the very first visit nothing is cached, so
  the ref defaults to false and that load runs the legacy path, mirroring the
  pattern used for the other rollout flags (see preMountLoginMask.ts,
  nativeStorefrontLinks.ts, multiLanguageFlagCache.ts).

  TODO(B2B-5366): remove this bridge once the flag is fully rolled out and
  legacyInitializeApp.ts is deleted.
*/
const PREVENT_PREMATURE_ORDERS_REDIRECT_STORAGE_KEY =
  'b2b-prevent-premature-orders-redirect-enabled';

export const setPreventPrematureOrdersRedirectEnabled = (enabled: boolean) => {
  try {
    localStorage.setItem(PREVENT_PREMATURE_ORDERS_REDIRECT_STORAGE_KEY, String(enabled));
  } catch {
    // localStorage can throw (e.g. Safari private mode, storage disabled).
    // Caching is best-effort here, so a write failure must not break getStoreConfigs.
  }
};

export const isPreventPrematureOrdersRedirectCached = (): boolean => {
  try {
    return localStorage.getItem(PREVENT_PREMATURE_ORDERS_REDIRECT_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
};
