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
  companyId: number
  b2bId: number
  customerId: string | number
}

interface EndMasqueradeParams {
  dispatch: DispatchProps
  salesRepCompanyId: number
  b2bId: number
}

export const startMasquerade = async ({
  companyId,
  b2bId,
  customerId,
}: StartMasqueradeParams) => {
  // change group in bc throug b2b api
  await superAdminBeginMasquerade(companyId, b2bId)

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
}

export const endMasquerade = async ({
  b2bId,
  dispatch,
}: EndMasqueradeParams) => {
  const { masqueradeCompany } = store.getState().b2bFeatures
  const salesRepCompanyId = masqueradeCompany.id

  // change group in bc throug b2b api
  await superAdminEndMasquerade(salesRepCompanyId, b2bId)

  store.dispatch(clearMasqueradeCompany())

  dispatch({
    type: 'common',
    payload: {
      salesRepCompanyName: '',
      salesRepCustomerGroupId: '',
    },
  })
}
