import { useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { Loading } from '@/components/loading';
import { endUserMasqueradingCompany, superAdminEndMasquerade } from '@/shared/service/b2b';
import { bcLogoutLogin } from '@/shared/service/bc';
import { isLoggedInSelector, store, useAppSelector } from '@/store';
import { clearCompanySlice } from '@/store/slices/company';

const logout = () => {
  return bcLogoutLogin().then((res) => {
    if (res.data.logout.result !== 'success') {
      throw new Error('Failed to logout');
    }
  });
};

const useEndMasquerade = () => {
  const isAgenting = useAppSelector(({ b2bFeatures }) => b2bFeatures.masqueradeCompany.isAgenting);
  const salesRepCompanyId = useAppSelector(({ b2bFeatures }) => b2bFeatures.masqueradeCompany.id);

  return useCallback(async () => {
    if (isAgenting) {
      superAdminEndMasquerade(Number(salesRepCompanyId));
    }
  }, [isAgenting, salesRepCompanyId]);
};

const useEndCompanyMasquerade = () => {
  const { selectCompanyHierarchyId } = useAppSelector(
    ({ company }) => company.companyHierarchyInfo,
  );

  return useCallback(async () => {
    if (selectCompanyHierarchyId) {
      await endUserMasqueradingCompany();
    }
  }, [selectCompanyHierarchyId]);
};

// The Catalyst B2B token is pushed into the portal asynchronously, so the first
// render here routinely has no session yet. Wait this long for the session to resolve
// before giving up, rather than logging the shopper out on sight — which bounced a
// valid-but-slow login back to /login. Covers normal slowness; a token that takes
// longer than this (or never arrives) still falls through to logout.
const LOGIN_RESOLUTION_GRACE_MS = 3000;

export function CatalystLogin() {
  const navigate = useNavigate();
  const endMasquerade = useEndMasquerade();
  const endCompanyMasquerading = useEndCompanyMasquerade();
  const isLoggedIn = useAppSelector(isLoggedInSelector);
  const [searchParams] = useSearchParams();

  const loginFlag = searchParams.get('loginFlag');

  const runLogout = useCallback(() => {
    Promise.all([logout(), endMasquerade(), endCompanyMasquerading()])
      .catch(() => {
        navigate('/orders');
      })
      .then(() => {
        window.sessionStorage.clear();
        store.dispatch(clearCompanySlice());
        window.b2b.callbacks.dispatchEvent('on-logout');
      });
  }, [endCompanyMasquerading, endMasquerade, navigate]);

  useEffect(() => {
    // An explicit logout request should tear down immediately.
    if (loginFlag === 'loggedOutLogin') {
      runLogout();

      return undefined;
    }

    // Session resolved — enter the app.
    if (isLoggedIn) {
      navigate('/orders');

      return undefined;
    }

    // Not resolved yet: give the pushed token / customer resolution a grace window,
    // and only log out if it never completes.
    const timer = setTimeout(runLogout, LOGIN_RESOLUTION_GRACE_MS);

    return () => clearTimeout(timer);
  }, [isLoggedIn, loginFlag, navigate, runLogout]);

  return <Loading />;
}
