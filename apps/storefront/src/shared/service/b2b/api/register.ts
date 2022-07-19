import { B3Request } from '../../request/b3Fetch'

interface CustomFieldItems {
  [key: string]: any
}

export const createBCCompanyUser = (data: CustomFieldItems): CustomFieldItems => B3Request.post('/api/v2/proxy', data)
