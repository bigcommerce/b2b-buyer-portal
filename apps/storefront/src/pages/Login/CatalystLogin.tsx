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

const WAIT_FOR_SESSION_FLAG = 'B2B-5408.catalyst_login_wait_for_session';

// When wait-for-session is enabled: the Catalyst B2B token is pushed into the portal
// asynchronously, so the first render here routinely has no session yet. Wait this
// long for it to resolve before giving up, rather than logging the shopper out on
// sight — which bounced a valid-but-slow login back to /login.
const LOGIN_RESOLUTION_GRACE_MS = 3000;

export function CatalystLogin() {
  const navigate = useNavigate();
  const endMasquerade = useEndMasquerade();
  const endCompanyMasquerading = useEndCompanyMasquerade();
  const isLoggedIn = useAppSelector(isLoggedInSelector);
  const B2BToken = useAppSelector(({ company }) => company.tokens.B2BToken);
  const waitForSession = useAppSelector(
    ({ global }) => global.featureFlags[WAIT_FOR_SESSION_FLAG] ?? false,
  );
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

  // Legacy fallback redirect — kept only while wait-for-session is off, so toggling
  // the flag reverts to the previous behaviour exactly.
  useEffect(() => {
    if (waitForSession) {
      return undefined;
    }

    const timeout = setTimeout(() => {
      window.location.href = '/login';
    }, LOGIN_RESOLUTION_GRACE_MS);

    return () => clearTimeout(timeout);
  }, [B2BToken, waitForSession]);

  useEffect(() => {
    // An explicit logout request should tear down immediately.
    if (loginFlag === 'loggedOutLogin') {
      runLogout();

      return undefined;
    }

    if (!waitForSession) {
      // Previous behaviour: log out on sight when the token isn't present.
      if (!B2BToken) {
        runLogout();
      } else if (isLoggedIn) {
        navigate('/orders');
      }

      return undefined;
    }

    // Session already resolved — enter the app.
    if (isLoggedIn) {
      navigate('/orders');

      return undefined;
    }

    // Wait for the asynchronously-pushed session to resolve. When the grace elapses,
    // re-check live store state: if the token has since arrived (or the session
    // resolved), enter the app instead of tearing down a valid, still-resolving login.
    const timer = setTimeout(() => {
      const state = store.getState();
      const sessionArrived = Boolean(state.company.tokens.B2BToken) || isLoggedInSelector(state);

      if (sessionArrived) {
        navigate('/orders');

        return;
      }

      runLogout();
    }, LOGIN_RESOLUTION_GRACE_MS);

    return () => clearTimeout(timer);
  }, [B2BToken, isLoggedIn, loginFlag, navigate, runLogout, waitForSession]);

  return <Loading />;
}
