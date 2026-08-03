import { useCallback } from 'react';

import { dispatchEvent } from '@/hooks/useB2BCallback';
import { endUserMasqueradingCompany, superAdminEndMasquerade } from '@/shared/service/b2b';
import { clearMasqueradeCompany, useAppDispatch, useAppSelector } from '@/store';
import { performStorefrontLogout } from '@/utils/performStorefrontLogout';

const useEndMasquerade = () => {
  const isMasquerading = useAppSelector(
    ({ b2bFeatures }) => b2bFeatures.masqueradeCompany.isAgenting,
  );
  const salesRepCompanyId = useAppSelector(({ b2bFeatures }) => b2bFeatures.masqueradeCompany.id);
  const storeDispatch = useAppDispatch();

  return useCallback(async () => {
    if (isMasquerading) {
      await superAdminEndMasquerade(Number(salesRepCompanyId));
      storeDispatch(clearMasqueradeCompany());
    }
  }, [salesRepCompanyId, storeDispatch, isMasquerading]);
};

const useEndCompanyMasquerading = () => {
  const { selectCompanyHierarchyId } = useAppSelector(
    ({ company }) => company.companyHierarchyInfo,
  );

  return useCallback(async () => {
    if (selectCompanyHierarchyId) {
      await endUserMasqueradingCompany();
    }
  }, [selectCompanyHierarchyId]);
};

interface LogoutOptions {
  showLogoutBanner?: boolean;
}

export const useLogout = () => {
  const endMasquerade = useEndMasquerade();
  const endCompanyMasquerading = useEndCompanyMasquerading();

  const logout = useCallback(
    async ({ showLogoutBanner = true }: LogoutOptions) => {
      await performStorefrontLogout(() => Promise.all([endCompanyMasquerading(), endMasquerade()]));
      if (showLogoutBanner) {
        dispatchEvent('on-logout');
      }
    },
    [endCompanyMasquerading, endMasquerade],
  );

  return logout;
};
