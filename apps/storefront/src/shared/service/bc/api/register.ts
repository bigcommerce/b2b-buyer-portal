import {
  B3Request,
} from '../../request/b3Fetch'
import {
  RequestType,
} from '../../request/base'
import {
  bcBaseUrl,
} from '../../../../utils/basicConfig'

export const getBCRegisterCustomFields = (): any => B3Request.get(`${bcBaseUrl}/api/storefront/form-fields`, RequestType.BCRest)
