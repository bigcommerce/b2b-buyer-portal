import { DispatchProps } from '@/shared/global/context/config'
import {
  getAgentInfo,
  superAdminBeginMasquerade,
  superAdminEndMasquerade,
} from '@/shared/service/b2b'
import { store } from '@/store'
import { setIsAgenting } from '@/store/slices/b2bFeatures'

import { B3SStorage } from './b3Storage'

interface StartMasqueradeParams {
  dispatch: DispatchProps
  companyId: number
  B3UserId: number
  customerId: string | number
}

interface EndMasqueradeParams {
  dispatch: DispatchProps
  salesRepCompanyId: number
  B3UserId: number
}

export const startMasquerade = async ({
  dispatch,
  companyId,
  B3UserId,
  customerId,
}: StartMasqueradeParams) => {
  // change group in bc throug b2b api
  await superAdminBeginMasquerade(companyId, B3UserId)

  // get data to be saved on global
  const data = await getAgentInfo(customerId)
  if (!data?.superAdminMasquerading) return
  const { id, companyName, customerGroupId = 0 } = data.superAdminMasquerading

  store.dispatch(setIsAgenting({ isAgenting: true }))
  B3SStorage.set('salesRepCompanyId', id)
  B3SStorage.set('salesRepCompanyName', companyName)
  B3SStorage.set('salesRepCustomerGroupId', customerGroupId)

  dispatch({
    type: 'common',
    payload: {
      salesRepCompanyId: id,
      salesRepCompanyName: companyName,
      salesRepCustomerGroupId: customerGroupId,
      isB2BUser: true,
    },
  })
}

export const endMasquerade = async ({
  salesRepCompanyId,
  B3UserId,
  dispatch,
}: EndMasqueradeParams) => {
  // change group in bc throug b2b api
  await superAdminEndMasquerade(salesRepCompanyId, B3UserId)

  store.dispatch(setIsAgenting({ isAgenting: false }))
  B3SStorage.delete('salesRepCompanyId')
  B3SStorage.delete('salesRepCompanyName')
  B3SStorage.delete('salesRepCustomerGroupId')

  dispatch({
    type: 'common',
    payload: {
      salesRepCompanyId: '',
      salesRepCompanyName: '',
      salesRepCustomerGroupId: '',
    },
  })
}
