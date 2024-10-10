import { storeHash } from '@/utils';

import B3Request from '../../request/b3Fetch';
import { RequestType } from '../../request/base';

export const validateBCCompanyExtraFields = (data: CustomFieldItems) =>
  B3Request.post('/api/v2/extra-fields/company/validate', RequestType.B2BRest, {
    ...data,
    storeHash,
  });

export const validateBCCompanyUserExtraFields = (data: CustomFieldItems) =>
  B3Request.post('/api/v2/extra-fields/user/validate', RequestType.B2BRest, {
    ...data,
    storeHash,
  });
