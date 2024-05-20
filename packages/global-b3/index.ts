/**
 * B3Local will be removed soon, this is just to TS warns you if you add more variables to it
 */
export interface B3Local {
  setting: {
    b2b_url: string
    b2b_socket_url: string
    captcha_setkey: string
  }
  'dom.checkoutRegisterParentElement': '#b2bParent'
  'dom.openB3Checkout': 'childB2b'
  'dom.navUserLoginElement': '#headless-container'
  before_login_goto_page: '/'
}
interface ThemeElementsProps {
  [key: string]: string
}

const themeOtherElementConfig = () => {
  const originElement =
    '[href^="/account.php"],  [href^="/account.php"] .navUser-item-accountLabel, [href^="/account.php?action=address_book"], [href^="/account.php?action=order_status"], [href^="/account.php?action=account_details"], [href="/login.php"], [href="/login.php?action=create_account"]'
  let allOtherElement = originElement
  // Deadline: September 05, 2023--[Theme Camden and theme RightRope] and [Theme LifeStyle and theme Vault] require the same configuration, so only one is required
  // Camden: '[href="/account.php"] svg, [href="/account.php"] svg use, [href="/account.php"] span, [href="/account.php"], [href="/login.php"] span, [href="/login.php"] svg use, [href="/login.php"] svg, [href="/login.php"]'
  // Vault: '.navUser-item--account a, .navUser-item--account a svg',
  // Fortune: '[href="/login.php?action=create_account"]',
  // Pinnacle: Theme Pinnacle and NextGen are compatible with the theme LifeStyle;; Artisan、CoventGarden、 Artify: method compatible
  const themeElements: ThemeElementsProps = {
    Hera: '[href^="/account.php"] span, .account-item .account-action span svg, .account-item .account-action span svg use, [href^="/login.php?action=logout"], [href="/login.php"] .icon, .account-item .account-action span',
    RightRope:
      '[href="/account.php"] svg, [href="/account.php"] svg use, [href="/account.php"] span, [href="/account.php"], [href="/login.php"] span, [href="/login.php"] svg use, [href="/login.php"] svg, [href="/login.php"]',
    SuperMarket: '[href="/login.php"] span, [href="/account.php"] span',
    LifeStyle:
      '.navUser-item--account a, .navUser-item--account a svg, .navUser-section-sub .navUser-item .needsclick, .navUser-section-sub .navUser-item .needsclick svg, .navUser-section-sub .navUser-item .needsclick span, .navUser-section-sub .navUser-item a, .navUser-section-sub .navUser-item a svg, .navUser-section-sub .navUser-item a svg use, .navUser-section-sub .navUser-item a span',
    Chiara:
      '.navUser-item--more, #navUser-more-toggle, #navUser-more-toggle .navUser-item-icon, #navUser-more-toggle .navUser-item-icon svg, #navUser-more-toggle .navUser-item-icon svg use, #navUser-more-toggle .navUser-item-moreLabel, .header-top-item--login, .header-top-item--login .header-top-action, .header-top-item--logout, .header-top-item--logout [href^="/login.php?action=logout"]',
    HaloOne:
      '[href^="/account.php"] svg, [href^="/account.php"] svg path, [href="/login.php"] svg path',
    FinchUS: '[href^="/account.php"] img',
  }

  Object.values(themeElements).forEach((value) => {
    allOtherElement = allOtherElement.concat(value, ',')
  })
  allOtherElement = allOtherElement.slice(0, -1)

  return {
    'dom.allOtherElement': `${allOtherElement}`,
  }
}

const globalB3 = {
  'dom.registerElement':
    '[href^="/login.php"], #checkout-customer-login, [href="/login.php"] .navUser-item-loginLabel, #checkout-customer-returning .form-legend-container [href="#"]',
  'dom.registerUrl': '/register',
  'dom.checkoutRegisterParentElement': '#checkout-app',
  'dom.navUserLoginElement': '.navUser-item.navUser-item--account',
  'dom.setToQuote': '#form-action-addToCart',
  'dom.setToShoppingListParentEl': '#add-to-cart-wrapper',
  'dom.setToNoPuchasable': '#add-to-cart-wrapper',
  'dom.cartActions.container': '.cart-actions',
  'dom.openB3Checkout': 'checkout-customer-continue',
  'dom.cart':
    '[href="/cart.php"], #form-action-addToCart, [data-button-type="add-cart"], [data-emthemesmodez-cart-item-add]',
  'dom.productView': '.productView',
  'dom.register': '[href^="/login.php?action=create_account"]',
  'dom.hideThemePayments':
    '.cart-additionalCheckoutButtons, .previewCart-additionalCheckoutButtons, .previewCartCheckout-additionalCheckoutButtons, [data-content-region="cart_below_totals"], .add-to-cart-wallet-buttons, [data-content-region="product_below_price"]',
  before_login_goto_page: '/account.php?action=order_status',
  checkout_super_clear_session: 'true',
  ...themeOtherElementConfig(),
  ...window.B3Local,
  setting: {
    b2b_url: 'https://api-b2b.staging.zone',
    b2b_socket_url: 'https://api-b2b.staging.zone',
    ...window.B3Local?.setting,
  },
}

export default globalB3
