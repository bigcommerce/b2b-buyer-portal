import {
  B3Request,
} from '../../request/b3Fetch'
import {
  RequestType,
} from '../../request/base'
import {
  bcBaseUrl,
} from '../../../../utils/basicConfig'

export const getCartInfo = (): CustomFieldItems => B3Request.get(`${bcBaseUrl}/api/storefront/carts`, RequestType.BCRest)

export const createCart = (data: CustomFieldItems): CustomFieldItems => B3Request.post(`${bcBaseUrl}/api/storefront/carts`, RequestType.BCRest, data)

export const addProductToCart = (data: CustomFieldItems, cartId: string): CustomFieldItems => B3Request.post(`${bcBaseUrl}/api/storefront/carts/${cartId}/items`, RequestType.BCRest, data)
