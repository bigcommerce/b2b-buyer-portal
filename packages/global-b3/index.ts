declare global {
  interface Window {
    B3: any
    B3Local: any
    B3CustomConfig: any
  }
}

const localConfig = () => {
  if (window?.B3) {
    return window.B3
  }

  return window.B3Local
}

const globalB3 = {
  'dom.registerElement': '[href^="/login.php"], #checkout-customer-login',
  'dom.registerUrl': '/registered',
  'dom.allOtherElement': '[href^="/account.php"]',
  'dom.checkoutRegisterParentElement': '#checkout-app',
  'dom.navUserLoginElement': '.navUser-item.navUser-item--account',
  'dom.setToQuote': '#form-action-addToCart',
  'dom.setToShoppingListParentEl': '#add-to-cart-wrapper',
  'dom.cartActions.container': '.cart-actions',
  'dom.openB3Checkout': 'checkout-customer-continue',
  'dom.cartElement':
    '[href="/cart.php"], #form-action-addToCart, [data-button-type="add-cart"]',
  before_login_goto_page: '/account.php?action=order_status',
  checkout_super_clear_session: 'true',
  setting: {
    b2b_url: 'https://staging-v2.bundleb2b.net',
    b2b_socket_url: 'https://staging-v2.bundleb2b.net',
  },
  ...localConfig(),
  ...(window?.B3CustomConfig || {}),
}

export default globalB3
