declare global {
  interface Window { B3: any; }
}

const localConfig = () => {
  if (window?.B3) {
    return window.B3
  }

  return window.B3Local
}

const globalB3 = {
  'dom.registerElement': '[href^="/login.php"]',
  'dom.registerUrl': '/registered',
  'dom.allOtherElement': '[href^="/account.php"]',
  'dom.checkoutRegisterParentElement': '.checkout-step--customer .checkout-view-content',
  'dom.navUserLoginElement': '.navUser-item.navUser-item--account',
  'dom.setToQuote': '#form-action-addToCart',
  'dom.setToShoppingListParentEl': '#add-to-cart-wrapper',
  'dom.cartActions.container': '.cart-actions',
  before_login_goto_page: '/',
  setting: {
    b2b_url: 'https://staging-v2.bundleb2b.net',
    b2b_socket_url: 'https://staging-v2.bundleb2b.net',
  },
  ...localConfig(),
}

export default globalB3
