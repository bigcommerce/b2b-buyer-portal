import { bcBaseUrl } from '../../../../utils/basicConfig'
import B3Request from '../../request/b3Fetch'
import { RequestType } from '../../request/base'

export const getBCForgotPassword = (data: CustomFieldItems): CustomFieldItems =>
  B3Request.post(
    `${bcBaseUrl()}/login.php?action=send_password_email`,
    RequestType.BCRest,
    data
  )

export const getBcCurrentJWT = (data: CustomFieldItems) =>
  B3Request.get(`${bcBaseUrl()}/customer/current.jwt`, RequestType.BCRest, data)
