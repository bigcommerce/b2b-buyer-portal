vi.mock('./react-setup', () => ({}));

const importLoadFunctions = async () => import('./load-functions');

describe('bindLinks', () => {
  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = '';
    window.history.pushState({}, '', '/');
  });

  afterEach(async () => {
    const { unbindLinks } = await importLoadFunctions();
    unbindLinks();
  });

  it('intercepts account link child clicks and stores the resolved anchor element', async () => {
    document.body.innerHTML = `
      <a class="navUser-action" href="/account.php">
        <span class="navUser-item-accountLabel">Account</span>
      </a>
    `;
    const { bindLinks } = await importLoadFunctions();
    const span = document.querySelector('.navUser-item-accountLabel');
    const anchor = document.querySelector('.navUser-action');
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });

    bindLinks();
    span?.dispatchEvent(click);

    expect(click.defaultPrevented).toBe(true);
    expect(window.b2b.initializationEnvironment.clickedLinkElement).toBe(anchor);
  });

  it('intercepts same-origin absolute account links even without navUser classes', async () => {
    document.body.innerHTML = `
      <li class="menu-item">
        <a href="${window.location.origin}/account.php">Account</a>
      </li>
    `;
    const { bindLinks } = await importLoadFunctions();
    const anchor = document.querySelector('a[href]');
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });

    bindLinks();
    anchor?.dispatchEvent(click);

    expect(click.defaultPrevented).toBe(true);
    expect(window.b2b.initializationEnvironment.clickedLinkElement).toBe(anchor);
  });
});
