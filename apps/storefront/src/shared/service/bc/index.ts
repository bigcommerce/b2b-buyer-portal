import {
  getBCRegisterCustomFields,
} from './api/register'

import {
  getBCForgotPassword,
  getBcCurrentJWT,
} from './api/login'

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
}
