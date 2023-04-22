import { bcBaseUrl } from '../../../../utils/basicConfig'
import B3Request from '../../request/b3Fetch'
import { RequestType } from '../../request/base'

const getBCRegisterCustomFields = (): CustomFieldItems =>
  B3Request.get(`${bcBaseUrl}/api/storefront/form-fields`, RequestType.BCRest)

export default getBCRegisterCustomFields
