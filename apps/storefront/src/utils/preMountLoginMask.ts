// A pre-mount mask that hides the storefront's native login.php content as soon
// as the bundle parses, so the merchant doesn't see a flash of BC's native form
// before React mounts and the buyer-portal iframe activates.
//
// The mask is painted at z-index 11999, i.e. *just below* the iframe
// (--z-index-IFRAME = 12000). That ordering is deliberate: once the iframe is
// active and opaque it paints on top of the mask, so the mask can safely stay
// mounted as an opaque backdrop while the in-iframe login page is still loading
// (its B3Spin uses a transparent background). It must therefore only be removed
// once the buyer portal has either rendered its login page or decided not to
// take over the page — removing it on `isOpen` is too early and lets the native
// form flash through the still-loading, transparent iframe.
const PRE_MOUNT_LOGIN_MASK_ID = 'b2b-pre-mount-login-mask';

export const injectPreMountLoginMask = () => {
  const { pathname, search } = window.location;
  if (!pathname.includes('login.php') || search.includes('change_password')) return;
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
