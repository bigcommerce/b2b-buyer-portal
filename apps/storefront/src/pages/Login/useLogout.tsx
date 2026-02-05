import { useCallback } from 'react';

import { dispatchEvent } from '@/hooks/useB2BCallback';
import { endUserMasqueradingCompany, superAdminEndMasquerade } from '@/shared/service/b2b';
import { bcLogoutLogin } from '@/shared/service/bc';
import { clearMasqueradeCompany, useAppDispatch, useAppSelector } from '@/store';
import b2bLogger from '@/utils/b3Logger';
import { logoutSession } from '@/utils/logoutSession';

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
      try {
        const { result } = (await bcLogoutLogin()).data.logout;

        if (result !== 'success') {
          return;
        }

        await Promise.all([endCompanyMasquerading(), endMasquerade()]);
      } catch (e) {
        b2bLogger.error(e);
      } finally {
        // SUP-1282 Clear sessionStorage to allow visitors to display the checkout page
        window.sessionStorage.clear();
        logoutSession();
        if (showLogoutBanner) {
          dispatchEvent('on-logout');
        }
      }
    },
    [endCompanyMasquerading, endMasquerade],
  );

  return logout;
};
