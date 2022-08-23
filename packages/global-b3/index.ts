declare const window: any

const globalB3 = {
  'dom.registerElement': '[href^="/login.php"]',
  'dom.registerUrl': '/registered',
  'dom.checkoutRegisterParentElement': '.checkout-step--customer .checkout-view-content',
  before_login_goto_page: '/',
  ...window.B3,
}

export default globalB3
