import { BigCommerceStorefrontAPIBaseURL } from '../../../../utils/basicConfig';
import B3Request from '../../request/b3Fetch';
import { RequestType } from '../../request/base';

const getBCRegisterCustomFields = () =>
  B3Request.get(
    `${BigCommerceStorefrontAPIBaseURL}/api/storefront/form-fields`,
    RequestType.BCRest,
  );

export default getBCRegisterCustomFields;
