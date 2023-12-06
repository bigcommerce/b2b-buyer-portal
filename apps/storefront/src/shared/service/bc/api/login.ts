import { bcBaseUrl } from '../../../../utils/basicConfig'
import B3Request from '../../request/b3Fetch'
import { RequestType } from '../../request/base'

export const getBCForgotPassword = (data: CustomFieldItems): CustomFieldItems =>
  B3Request.post(
    `${bcBaseUrl()}/login.php?action=send_password_email`,
    RequestType.BCRest,
    data
  )
/**
 * This function it's still present due the merchant can logs in as a client and stencil channels trade the current customer jwt to recognize
 * which user log in on the channel
 */
export const getCurrentCustomerJWT = (data: CustomFieldItems) =>
  B3Request.get(`${bcBaseUrl()}/customer/current.jwt`, RequestType.BCRest, data)

/**
 * In order to be less dependent on current customer jwt, this function it's called every time an user logs in by using the login form
 * it makes the stencil channel recognize the user who log in the channel
 */
export const customerLoginAPI = (storefrontLoginToken: string) =>
  fetch(`${bcBaseUrl()}/login/token/${storefrontLoginToken}`, { method: 'GET' })
