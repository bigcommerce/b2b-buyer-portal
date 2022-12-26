declare const window: any

const globalB3 = {
  'dom.registerElement': '[href^="/login.php"]',
  'dom.registerUrl': '/registered',
  'dom.allOtherElement': '[href^="/account.php"]',
  'dom.checkoutRegisterParentElement': '.checkout-step--customer .checkout-view-content',
  'dom.navUserLoginElement': '.navUser-item.navUser-item--account',
  'dom.setToShoppingList': '#form-action-addToCart',
  'dom.setToShoppingListParentEl': '#add-to-cart-wrapper',
  before_login_goto_page: '/',
  setting: {
    b2b_url: 'https://staging-v2.bundleb2b.net',
    b2b_socket_url: 'https://staging-v2.bundleb2b.net',
  },
  ...window.B3,
}

export default globalB3
