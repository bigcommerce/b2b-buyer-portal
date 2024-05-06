import { baseUrl } from '../../../../utils/basicConfig';
import B3Request from '../../request/b3Fetch';
import { RequestType } from '../../request/base';

const getBCProductVariantId = (productId: number, data: CustomFieldItems): CustomFieldItems =>
  B3Request.post(`${baseUrl}/remote/v1/product-attributes/${productId}`, RequestType.BCRest, data);

export default getBCProductVariantId;
