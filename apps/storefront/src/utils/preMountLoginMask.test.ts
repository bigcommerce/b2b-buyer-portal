import { injectPreMountLoginMask, removePreMountLoginMask } from './preMountLoginMask';

const MASK_ID = 'b2b-pre-mount-login-mask';

const getMask = () => document.getElementById(MASK_ID);

afterEach(() => {
  getMask()?.remove();
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
