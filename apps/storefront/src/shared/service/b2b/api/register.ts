import { B3Request } from '../../request/b3Fetch'
import { RequestType } from '../../request/base'

interface CustomFieldItems {
  [key: string]: any
}

const storeHash = (window as any).b3?.setting?.storeHash || 'rtmh8fqr05'

export const createBCCompanyUser = (data: CustomFieldItems): CustomFieldItems => B3Request.post('/api/v2/proxy', RequestType.B2BRest, data)

export const validateBCCompanyExtraFields = (data: CustomFieldItems): CustomFieldItems => B3Request.post('/api/v2/extra-fields/company/validate', RequestType.B2BRest, { ...data, storeHash })
