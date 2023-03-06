import {
  getBCRegisterCustomFields,
} from './api/register'

import {
  getBCForgotPassword,
  getBcCurrentJWT,
} from './api/login'

import {
  createCart,
  getCartInfo,
  addProductToCart,
  getCartInfoWithOptions,
  deleteCart,
} from './api/cart'

import {
  getBCProductVariantId,
} from './api/product'

import {
  bcLogin,
  bcLogoutLogin,
} from './graphql/login'

import {
  getCustomerInfo,
} from './graphql/user'

export {
  getBCRegisterCustomFields,
  getBCForgotPassword,
  bcLogin,
  bcLogoutLogin,
  getCustomerInfo,
  getBcCurrentJWT,
  getBCProductVariantId,
  createCart,
  getCartInfo,
  addProductToCart,
  getCartInfoWithOptions,
  deleteCart,
}
