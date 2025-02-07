import {
  getAgentInfo,
  superAdminBeginMasquerade,
  superAdminEndMasquerade,
} from '@/shared/service/b2b';
import { clearMasqueradeCompany, MasqueradeCompany, setMasqueradeCompany, store } from '@/store';

interface StartMasqueradeParams {
  companyId: number;
  customerId: string | number;
}

export const startMasquerade = async ({ companyId, customerId }: StartMasqueradeParams) => {
  // change group in bc through b2b api
  await superAdminBeginMasquerade(companyId);

  // get data to be saved on global
  const data = await getAgentInfo(customerId);
  if (!data?.superAdminMasquerading) return;
  const { id, companyName, customerGroupId = 0 } = data.superAdminMasquerading;

  const masqueradeCompany: MasqueradeCompany = {
    masqueradeCompany: {
      id,
      isAgenting: true,
      companyName,
      customerGroupId,
    },
  };

  store.dispatch(setMasqueradeCompany(masqueradeCompany));
};

export const endMasquerade = async () => {
  const { masqueradeCompany } = store.getState().b2bFeatures;
  const salesRepCompanyId = masqueradeCompany.id;

  // change group in bc through b2b api
  await superAdminEndMasquerade(salesRepCompanyId);

  store.dispatch(clearMasqueradeCompany());
};
