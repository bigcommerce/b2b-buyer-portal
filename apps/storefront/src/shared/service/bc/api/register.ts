import { store } from '@/store/reducer'

import B3Request from '../../request/b3Fetch'
import { RequestType } from '../../request/base'

const getBCRegisterCustomFields = (): CustomFieldItems =>
  B3Request.get(
    `${store.getState().global.bcUrl}/api/storefront/form-fields`,
    RequestType.BCRest
  )

export default getBCRegisterCustomFields
