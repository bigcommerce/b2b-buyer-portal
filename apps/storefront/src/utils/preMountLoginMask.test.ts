import {
  injectPreMountLoginMask,
  isDefaultLoginStylingActive,
  removePreMountLoginMask,
  setDefaultLoginStylingEnabled,
  shouldUseDefaultLoginStyling,
} from './preMountLoginMask';

const MASK_ID = 'b2b-pre-mount-login-mask';

const getMask = () => document.getElementById(MASK_ID);

// The pre-mount mask is gated behind the default-login-styling feature flag,
// cached in localStorage. The gate is optimistic: it masks unless the flag has
// been explicitly cached as 'false'. Tests start from a clean (uncached) state
// and opt into the cached values they need.
afterEach(() => {
  getMask()?.remove();
  localStorage.clear();
});

describe('injectPreMountLoginMask', () => {
  it('injects the mask style element when on the login page', () => {
    window.location.assign('/login.php');

    injectPreMountLoginMask();

    const mask = getMask();
    expect(mask).not.toBeNull();
    expect(mask?.tagName).toBe('STYLE');
    expect(mask?.parentElement).toBe(document.head);
  });

  it('does not inject when not on the login page', () => {
    window.location.assign('/cart.php');

    injectPreMountLoginMask();

    expect(getMask()).toBeNull();
  });

  it('does not inject on the change password flow', () => {
    window.location.assign('/login.php?action=change_password');

    injectPreMountLoginMask();

    expect(getMask()).toBeNull();
  });

  it('still injects for other login.php query params', () => {
    window.location.assign('/login.php?action=create_account');

    injectPreMountLoginMask();

    expect(getMask()).not.toBeNull();
  });

  it('does not inject a second mask when one already exists', () => {
    window.location.assign('/login.php');

    injectPreMountLoginMask();
    injectPreMountLoginMask();

    expect(document.querySelectorAll(`#${MASK_ID}`)).toHaveLength(1);
  });

  it('does not inject when the flag is explicitly cached as off', () => {
    setDefaultLoginStylingEnabled(false);
    window.location.assign('/login.php');

    injectPreMountLoginMask();

    expect(getMask()).toBeNull();
  });

  it('injects optimistically when the flag has never been cached', () => {
    localStorage.clear();
    window.location.assign('/login.php');

    injectPreMountLoginMask();

    expect(getMask()).not.toBeNull();
  });
});

describe('isDefaultLoginStylingActive', () => {
  it('is true when the flag is cached as on', () => {
    setDefaultLoginStylingEnabled(true);

    expect(isDefaultLoginStylingActive()).toBe(true);
  });

  it('is true (optimistic) when the flag has never been cached', () => {
    localStorage.clear();

    expect(isDefaultLoginStylingActive()).toBe(true);
  });

  it('is false only when the flag is explicitly cached as off', () => {
    setDefaultLoginStylingEnabled(false);

    expect(isDefaultLoginStylingActive()).toBe(false);
  });
});

describe('shouldUseDefaultLoginStyling', () => {
  it('is true on the login page when the feature is active', () => {
    window.location.assign('/login.php');

    expect(shouldUseDefaultLoginStyling()).toBe(true);
  });

  it('is false when the flag is explicitly cached as off', () => {
    setDefaultLoginStylingEnabled(false);
    window.location.assign('/login.php');

    expect(shouldUseDefaultLoginStyling()).toBe(false);
  });

  it('is false when not on the login page even if the feature is active', () => {
    window.location.assign('/cart.php');

    expect(shouldUseDefaultLoginStyling()).toBe(false);
  });

  it('is false on the change password flow', () => {
    window.location.assign('/login.php?action=change_password');

    expect(shouldUseDefaultLoginStyling()).toBe(false);
  });
});

describe('removePreMountLoginMask', () => {
  it('removes the mask once it has been injected', () => {
    window.location.assign('/login.php');
    injectPreMountLoginMask();
    expect(getMask()).not.toBeNull();

    removePreMountLoginMask();

    expect(getMask()).toBeNull();
  });

  it('is a no-op when no mask is present', () => {
    expect(getMask()).toBeNull();

    expect(() => removePreMountLoginMask()).not.toThrow();

    expect(getMask()).toBeNull();
  });
});
