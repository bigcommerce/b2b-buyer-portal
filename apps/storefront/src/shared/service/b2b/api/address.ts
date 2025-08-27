import { storeHash } from '@/utils';

import B3Request from '../../request/b3Fetch';
import { RequestType } from '../../request/base';

const validateAddressExtraFields = (data: CustomFieldItems) =>
  B3Request.post('/api/v2/extra-fields/address/validate', RequestType.B2BRest, {
    ...data,
    storeHash,
  });

export default validateAddressExtraFields;
