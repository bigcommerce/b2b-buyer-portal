export const SUPPORT_LANGUAGE = ['en', 'zh', 'fr', 'nl', 'de', 'it', 'es']

export const FILE_UPLOAD_ACCEPT_TYPE = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'image/*',
]

export const re = {
  phone:
    /^((\(\+?[0-9]{0,2}\))|(\+?[0-9]{0,2}))?(\s|-)?((\([0-9]{1,5}\))|([0-9]{1,5}))((\s|-)?)([0-9]{2,4}){0,3}((\s|-)?)[0-9]{4}$/,
  email:
    /^([A-Za-z0-9.!#$%&'*+-/=?^_`{|}~])+@([A-Za-z0-9\-.])+\.([A-Za-z][A-Za-z0-9]{1,64})$/,
  password: /^(?=.*[0-9].*)(?=.*[A-Za-z].*).{7,}$/,
  number: /^\d+$/,
}

export const PRODUCT_DEFAULT_IMAGE =
  'https://cdn11.bigcommerce.com/s-1i6zpxpe3g/stencil/cd9e3830-4c73-0139-8a51-0242ac11000a/e/4fe76590-73f1-0139-3767-32e4ea84ca1d/img/ProductDefault.gif'

export const STORE_DEFAULT_LOGO =
  'https://cdn.bundleb2b.net/b2blogo/b2be-logo.png'

export enum HeadlessRoutes {
  SIGN_IN = '/login',
  LOG_OUT = '/login?loginFlag=3',
  FORGOT_PASSWORD = '/forgotpassword',
  REGISTER_ACCOUNT = '/register',
  DRAFT_QUOTE = '/quoteDraft',
  SHOPPING_LISTS = '/shoppingLists',
  DASHBOARD = '/dashboard',
  ORDERS = '/orders',
  COMPANY_ORDERS = '/company-orders',
  QUOTES = '/quotes',
  PURCHASED_PRODUCTS = '/purchased-products',
  ADDRESSES = '/addresses',
  USER_MANAGEMENT = '/user-management',
  ACCOUNT_SETTINGS = '/accountSettings',
  INVOICE = '/invoice',
  CLOSE = 'close',
}

export type HeadlessRoute = keyof typeof HeadlessRoutes

export const StatusNotifications = {
  pendingOrderingBlocked:
    'Your business account is pending approval. Ordering will be enabled after account approval.',
  pendingOrderingNotBlocked:
    'Your business account is pending approval. You will gain access to business account features after account approval.',
  pendingViewPriceBlocked:
    'Your business account is pending approval. You will gain access to business account features, products, and pricing after account approval.',
  pendingOrderingAndViewPriceBlocked:
    'Your business account is pending approval. Products, pricing, and ordering will be enabled after account approval',
  approvedTip:
    'Your business account has been approved. Check your email inbox, we sent you a letter with all details.',
  rejectedTip:
    'Your business account has been rejected. Check your email inbox, we sent you a letter with all details. You can resubmit your application.',
}

export const ADD_TO_QUOTE_DEFAULT_VALUE = 'Add to quote'
export const ADD_TO_SHOPPING_LIST_DEFUALT_VALUE = 'Add to Shopping List'
export const END_MASQUERADE_DEFAULT_VALUE = 'END MASQUERADE'
export const FINISH_QUOTE_DEFUALT_VALUE = 'Finish quote'
export const TRANSLATION_ADD_TO_QUOTE_VARIABLE =
  'global.customStyles.addQuoteBtn'
export const TRANSLATION_FINISH_QUOTE_VARIABLE =
  'global.customStyles.floatingAction'
export const TRANSLATION_MASQUERADE_BUTTON_VARIABLE =
  'global.customStyles.masqueradeButton'
export const TRANSLATION_SHOPPING_LIST_BTN_VARAIBLE =
  'global.customStyles.shoppingListBtn'
