import {
  B3Request,
} from '../../request/b3Fetch'
import {
  RequestType,
} from '../../request/base'
import {
  storeHash,
} from '../../../../utils/basicConfig'

interface CustomFieldItems {
  [key: string]: any
}

export const createBCCompanyUser = (data: CustomFieldItems): CustomFieldItems => B3Request.post('/api/v2/proxy', RequestType.B2BRest, data)

export const validateBCCompanyExtraFields = (data: CustomFieldItems): CustomFieldItems => B3Request.post('/api/v2/extra-fields/company/validate', RequestType.B2BRest, {
  ...data,
  storeHash,
})
