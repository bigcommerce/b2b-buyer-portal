import { store } from '@/store/reducer'

import B3Request from '../../request/b3Fetch'
import { RequestType } from '../../request/base'

export const createCartHeadless = (data: CustomFieldItems): CustomFieldItems =>
  B3Request.post(
    `${store.getState().global.bcUrl}/api/storefront/carts`,
    RequestType.BCRest,
    data
  )

export const getCartInfo = (): CustomFieldItems =>
  B3Request.get(
    `${store.getState().global.bcUrl}/api/storefront/carts`,
    RequestType.BCRest
  )

export const createCart = (data: CustomFieldItems): CustomFieldItems =>
  B3Request.post(
    `${store.getState().global.bcUrl}/api/storefront/carts`,
    RequestType.BCGraphql,
    data
  )

export const addProductToCart = (
  data: CustomFieldItems,
  cartId: string
): CustomFieldItems =>
  B3Request.post(
    `${store.getState().global.bcUrl}/api/storefront/carts/${cartId}/items`,
    RequestType.BCRest,
    data
  )

export const getCartInfoWithOptions = (): CustomFieldItems =>
  B3Request.get(
    `${
      store.getState().global.bcUrl
    }/api/storefront/carts?include=lineItems.digitalItems.options,lineItems.physicalItems.options`,
    RequestType.BCRest
  )

export const deleteCart = (cartId: string) =>
  B3Request.delete(
    `${store.getState().global.bcUrl}/api/storefront/carts/${cartId}`,
    RequestType.BCRest
  )
