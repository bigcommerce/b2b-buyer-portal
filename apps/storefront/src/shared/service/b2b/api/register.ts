import { storeHash } from '@/utils'

import B3Request from '../../request/b3Fetch'
import { RequestType } from '../../request/base'

import getProxyInfo from './proxy'

export const createBCCompanyUser = getProxyInfo

export const sendSubscribersState = getProxyInfo

export const validateBCCompanyExtraFields = (
  data: CustomFieldItems
): CustomFieldItems =>
  B3Request.post('/api/v2/extra-fields/company/validate', RequestType.B2BRest, {
    ...data,
    storeHash,
  })

export const validateBCCompanyUserExtraFields = (
  data: CustomFieldItems
): CustomFieldItems =>
  B3Request.post('/api/v2/extra-fields/user/validate', RequestType.B2BRest, {
    ...data,
    storeHash,
  })
