import { baseUrl } from '../../../../utils/basicConfig';
import B3Request from '../../request/b3Fetch';
import { RequestType } from '../../request/base';

interface Carts {
  detail?: string;
}

const rejectResponsesWithDetail = (res: Carts) => {
  if (res?.detail) {
    return Promise.reject(res);
  }

  return Promise.resolve(res);
};

export const createCartHeadless = (data: CustomFieldItems) =>
  B3Request.post(`${baseUrl}/api/storefront/carts`, RequestType.BCRest, data).then(
    rejectResponsesWithDetail,
  );

export const getCartInfo = () =>
  B3Request.get(`${baseUrl}/api/storefront/carts`, RequestType.BCRest).then(
    rejectResponsesWithDetail,
  );

export const createCart = (data: CustomFieldItems) =>
  B3Request.post(`${baseUrl}/api/storefront/carts`, RequestType.BCGraphql, data).then(
    rejectResponsesWithDetail,
  );

export const addProductToCart = (data: CustomFieldItems, cartId: string) =>
  B3Request.post(`${baseUrl}/api/storefront/carts/${cartId}/items`, RequestType.BCRest, data).then(
    rejectResponsesWithDetail,
  );

export const getCartInfoWithOptions = () =>
  B3Request.get(
    `${baseUrl}/api/storefront/carts?include=lineItems.digitalItems.options,lineItems.physicalItems.options`,
    RequestType.BCRest,
  ).then(rejectResponsesWithDetail);

export const deleteCart = (cartId: string) =>
  B3Request.delete(`${baseUrl}/api/storefront/carts/${cartId}`, RequestType.BCRest).then(
    rejectResponsesWithDetail,
  );
