import { DispatchProps } from '@/shared/global/context/config'
import {
  getAgentInfo,
  superAdminBeginMasquerade,
  superAdminEndMasquerade,
} from '@/shared/service/b2b'
import {
  clearMasqueradeCompany,
  MasqueradeCompany,
  setMasqueradeCompany,
  store,
} from '@/store'

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

  const masqueradeCompany: MasqueradeCompany = {
    masqueradeCompany: {
      id,
      isAgenting: true,
      companyName,
      companyStatus: customerGroupId,
    },
  }

  store.dispatch(setMasqueradeCompany(masqueradeCompany))

  dispatch({
    type: 'common',
    payload: {
      isB2BUser: true,
    },
  })
}

export const endMasquerade = async ({
  B3UserId,
  dispatch,
}: EndMasqueradeParams) => {
  const {masqueradeCompany} = store.getState().b2bFeatures
  const salesRepCompanyId = masqueradeCompany.id

  // change group in bc throug b2b api
  await superAdminEndMasquerade(salesRepCompanyId, B3UserId)

  store.dispatch(clearMasqueradeCompany())

  dispatch({
    type: 'common',
    payload: {
      salesRepCompanyName: '',
      salesRepCustomerGroupId: '',
    },
  })
}
