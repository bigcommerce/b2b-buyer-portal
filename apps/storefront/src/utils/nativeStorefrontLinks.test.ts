import {
  getClosestAnchorFromTarget,
  getNativeStorefrontPath,
  isBuyerPortalNativeHref,
  shouldOpenAllowedPageOnInit,
} from './nativeStorefrontLinks';

describe('getClosestAnchorFromTarget', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('returns the parent anchor when the clicked target is a child span', () => {
    document.body.innerHTML = `
      <a class="navUser-action" href="/account.php">
        <span class="navUser-item-accountLabel">Account</span>
      </a>
    `;

    const span = document.querySelector('.navUser-item-accountLabel');
    const anchor = document.querySelector('.navUser-action');

    expect(getClosestAnchorFromTarget(span)).toBe(anchor);
  });

  it('returns null when the event target is not an element', () => {
    expect(getClosestAnchorFromTarget(window)).toBeNull();
  });
});

describe('getNativeStorefrontPath', () => {
  it('normalizes same-origin absolute account URLs to path and search', () => {
    expect(getNativeStorefrontPath('https://store.example.com/account.php?action=order_status', 'https://store.example.com')).toBe(
      '/account.php?action=order_status',
    );
  });

  it('keeps relative account URLs as path and search', () => {
    expect(getNativeStorefrontPath('/account.php?action=address_book', 'https://store.example.com')).toBe(
      '/account.php?action=address_book',
    );
  });

  it('returns null for cross-origin URLs', () => {
    expect(getNativeStorefrontPath('https://other.example.com/account.php', 'https://store.example.com')).toBeNull();
  });
});

describe('isBuyerPortalNativeHref', () => {
  it('matches account.php and login.php URLs', () => {
    expect(isBuyerPortalNativeHref('/account.php', 'https://store.example.com')).toBe(true);
    expect(isBuyerPortalNativeHref('/account.php?action=order_status', 'https://store.example.com')).toBe(true);
    expect(isBuyerPortalNativeHref('/login.php', 'https://store.example.com')).toBe(true);
    expect(isBuyerPortalNativeHref('/login.php?action=create_account', 'https://store.example.com')).toBe(true);
  });

  it('does not match unrelated storefront URLs', () => {
    expect(isBuyerPortalNativeHref('/cart.php', 'https://store.example.com')).toBe(false);
    expect(isBuyerPortalNativeHref('/search.php?search_query=account.php', 'https://store.example.com')).toBe(false);
  });

  it('does not match cross-origin account URLs', () => {
    expect(isBuyerPortalNativeHref('https://other.example.com/account.php', 'https://store.example.com')).toBe(false);
  });
});

describe('shouldOpenAllowedPageOnInit', () => {
  it('opens on logged-in account.php without a hash', () => {
    expect(
      shouldOpenAllowedPageOnInit({
        pathname: '/account.php',
        hash: '',
        customerId: 123,
      }),
    ).toBe(true);
  });

  it('keeps the existing skip for other logged-in no-hash pages', () => {
    expect(
      shouldOpenAllowedPageOnInit({
        pathname: '/',
        hash: '',
        customerId: 123,
      }),
    ).toBe(false);
  });

  it('does not open on checkout pages', () => {
    expect(
      shouldOpenAllowedPageOnInit({
        pathname: '/checkout',
        hash: '',
        customerId: 123,
      }),
    ).toBe(false);
  });
});
