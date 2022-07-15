import { B3Request } from '../../request/b3Fetch'

export const getBCRegisterCustomFields = (): any => B3Request.get('/bigcommerce/api/storefront/form-fields')
