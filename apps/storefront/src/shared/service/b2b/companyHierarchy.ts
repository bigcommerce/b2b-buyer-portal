import { store } from '@/store';
import { setCompanyHierarchyInfoModules } from '@/store/slices/company';
import { CustomerRole } from '@/types';
import b2bLogger from '@/utils/b3Logger';
import { getAccountHierarchyIsEnabled } from '@/utils/storefrontConfig';

import { endUserMasqueradingCompany } from './graphql/global';
import { getCompanyHierarchyAndMasquerading } from './graphql/users';

const resetCompanyHierarchyState = () => ({
  isEnabledCompanyHierarchy: false,
  companyHierarchyAllList: [],
  selectCompanyHierarchyId: '',
  companyHierarchyList: [],
  companyHierarchySelectSubsidiariesList: [],
});

export const initializeCompanyHierarchy = async () => {
  const { customer } = store.getState().company;
  const { featureFlags } = store.getState().global;

  try {
    const { role } = customer;

    if (
      role === CustomerRole.ADMIN ||
      role === CustomerRole.SENIOR_BUYER ||
      role === CustomerRole.JUNIOR_BUYER ||
      role === CustomerRole.CUSTOM_ROLE
    ) {
      const isEnabledAccountHierarchy = await getAccountHierarchyIsEnabled();

      if (isEnabledAccountHierarchy) {
        const { companySubsidiaries, userMasqueradingCompany } =
          await getCompanyHierarchyAndMasquerading();

        const shouldEndCompanyMasqueradingOnLogin =
          featureFlags['B2B-3817.disable_masquerading_cleanup_on_login'];

        if (userMasqueradingCompany?.companyId && !shouldEndCompanyMasqueradingOnLogin) {
          await endUserMasqueradingCompany();
        }

        store.dispatch(
          setCompanyHierarchyInfoModules({
            companyHierarchyAllList: companySubsidiaries || [],
            isEnabledCompanyHierarchy: isEnabledAccountHierarchy,
            selectCompanyHierarchyId: userMasqueradingCompany?.companyId ?? '',
          }),
        );
      } else {
        store.dispatch(setCompanyHierarchyInfoModules(resetCompanyHierarchyState()));
      }
    } else {
      store.dispatch(setCompanyHierarchyInfoModules(resetCompanyHierarchyState()));
    }
  } catch (error) {
    b2bLogger.error('Failed to initialize company hierarchy:', error);
    store.dispatch(setCompanyHierarchyInfoModules(resetCompanyHierarchyState()));
  }
};
