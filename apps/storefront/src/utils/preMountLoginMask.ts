/*
  A pre-mount mask that hides the storefront's native login.php content as soon
  as the bundle parses, so the merchant doesn't see a flash of BC's native form
  before React mounts and the buyer-portal iframe activates.

  Gated behind the `B2B-4870.default_buyer_portal_styling_on_login_page` feature
  flag. That flag lives in StoreConfig and is only fetched (asynchronously)
  after React mounts, so it is not available at bundle-parse time when the mask
  must be painted. We therefore cache the resolved flag value in localStorage
  (see setDefaultLoginStylingEnabled, called from storefrontConfig once configs
  load) and read it back synchronously here.

  Because the flag is unknown on the very first visit (nothing cached yet), the
  gate is *optimistic*: we apply the styling unless we have explicitly cached
  that the feature is OFF. This guarantees that a flag-on store never flashes
  the native form, even on the first load. A flag-off store therefore shows the
  loading state once on its first ever visit; once getStoreConfigs caches
  'false', it reverts to the plain native flow on every subsequent load.

  The mask is painted at z-index 11999, i.e. *just below* the iframe
  (--z-index-IFRAME = 12000). That ordering is deliberate: once the iframe is
  active and opaque it paints on top of the mask, so the mask can safely stay
  mounted as an opaque backdrop while the in-iframe login page is still loading
  (its B3Spin uses a transparent background). It must therefore only be removed
  once the buyer portal has either rendered its login page or decided not to
  take over the page — removing it on `isOpen` is too early and lets the native
  form flash through the still-loading, transparent iframe.
*/
const PRE_MOUNT_LOGIN_MASK_ID = 'b2b-pre-mount-login-mask';

/*
  localStorage key caching the last-known value of the
  B2B-4870.default_buyer_portal_styling_on_login_page feature flag, so the
  pre-mount code can gate itself synchronously before StoreConfig is fetched.
*/
const DEFAULT_LOGIN_STYLING_STORAGE_KEY = 'b2b-default-login-styling-enabled';

/*
  Persist the resolved feature-flag value so the next page load can gate the
  pre-mount mask synchronously. Best-effort: localStorage can throw (e.g. Safari
  private mode or storage disabled), in which case the feature simply stays off
  until the flag can be read from StoreConfig after mount.
*/
export const setDefaultLoginStylingEnabled = (enabled: boolean) => {
  try {
    localStorage.setItem(DEFAULT_LOGIN_STYLING_STORAGE_KEY, String(enabled));
  } catch {
    // ignore: persistence is best-effort
  }
};

/*
  Whether the default-login-styling feature should be treated as active. We only
  back off when the flag has been explicitly cached as 'false'; an unknown
  (uncached) value is treated as active so flag-on stores never flash the native
  form on a cold start. Exported for the in-app login gate so it stays in lockstep
  with the pre-mount mask.
*/
export const isDefaultLoginStylingActive = (): boolean => {
  try {
    return localStorage.getItem(DEFAULT_LOGIN_STYLING_STORAGE_KEY) !== 'false';
  } catch {
    return true;
  }
};

const isLoginPage = (): boolean => {
  const { pathname, search } = window.location;
  return pathname.includes('login.php') && !search.includes('change_password');
};

/*
  True when the buyer portal should take over the native login.php form with its
  own styling: we're on the login page and the feature isn't explicitly off.
  Drives both the pre-mount mask and the eager app init in main.ts.
*/
export const shouldUseDefaultLoginStyling = (): boolean =>
  isLoginPage() && isDefaultLoginStylingActive();

export const injectPreMountLoginMask = () => {
  if (!shouldUseDefaultLoginStyling()) return;
  if (document.getElementById(PRE_MOUNT_LOGIN_MASK_ID)) return;

  const style = document.createElement('style');
  style.id = PRE_MOUNT_LOGIN_MASK_ID;
  style.textContent = `
    body::before {
      content: '';
      position: fixed;
      inset: 0;
      background: #FEF9F5;
      z-index: 11999;
    }
    body::after {
      content: '';
      position: fixed;
      top: 50%;
      left: 50%;
      width: 40px;
      height: 40px;
      margin: -20px 0 0 -20px;
      border: 3px solid rgba(0, 0, 0, 0.1);
      border-top-color: #292a25;
      border-radius: 50%;
      animation: b2b-pre-mount-spin 0.8s linear infinite;
      z-index: 11999;
    }
    @keyframes b2b-pre-mount-spin {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
};

export const removePreMountLoginMask = () => {
  document.getElementById(PRE_MOUNT_LOGIN_MASK_ID)?.remove();
};
