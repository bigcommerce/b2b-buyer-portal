import { B3Request } from '../../request/b3Fetch'

interface CustomFieldItems {
  [key: string]: any
}

const storeHash = (window as any).b3?.setting?.storeHash || 'rtmh8fqr05'

export const createBCCompanyUser = (data: CustomFieldItems): CustomFieldItems => B3Request.post('/api/v2/proxy', data)
