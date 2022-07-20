import { B3Request } from '../../request/b3Fetch'
import { RequestType } from '../../request/base'

export const getBCRegisterCustomFields = (): any => B3Request.get('/bigcommerce/api/storefront/form-fields', RequestType.BCRest)
