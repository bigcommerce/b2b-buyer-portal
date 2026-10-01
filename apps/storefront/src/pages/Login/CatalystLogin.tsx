import { useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { Loading } from '@/components/loading';
import {
  b2bLogout,
  endUserMasqueradingCompany,
  superAdminEndMasquerade,
} from '@/shared/service/b2b';
import { bcLogoutLogin } from '@/shared/service/bc';
import { isLoggedInSelector, store, useAppSelector } from '@/store';
import { clearCompanySlice } from '@/store/slices/company';
import b2bLogger from '@/utils/b3Logger';

// B2B-5611: revoke the B2B token server-side while it is still attached to requests.
const revokeB2BToken = async () => {
  if (!store.getState().company.tokens.B2BToken) {
    return;
  }
  try {
    await b2bLogout();
  } catch (e) {
    b2bLogger.error(e);
  }
};

const logout = async () => {
  await revokeB2BToken();
  const res = await bcLogoutLogin();
  if (res.data.logout.result !== 'success') {
    throw new Error('Failed to logout');
  }
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

export function CatalystLogin() {
  const navigate = useNavigate();
  const endMasquerade = useEndMasquerade();
  const endCompanyMasquerading = useEndCompanyMasquerade();
  const isLoggedIn = useAppSelector(isLoggedInSelector);
  const B2BToken = useAppSelector(({ company }) => company.tokens.B2BToken);
  const [searchParams] = useSearchParams();

  const loginFlag = searchParams.get('loginFlag');

  useEffect(() => {
    const timeout = setTimeout(() => {
      window.location.href = '/login';
    }, 3000);

    return () => {
      clearTimeout(timeout);
    };
  }, [B2BToken]);

  useEffect(() => {
    if (loginFlag === 'loggedOutLogin' || !B2BToken) {
      Promise.all([logout(), endMasquerade(), endCompanyMasquerading()])
        .catch(() => {
          navigate('/orders');
        })
        .then(() => {
          window.sessionStorage.clear();
          store.dispatch(clearCompanySlice());
          window.b2b.callbacks.dispatchEvent('on-logout');
        });
    } else if (isLoggedIn) {
      navigate('/orders');
    }
  }, [endCompanyMasquerading, endMasquerade, isLoggedIn, loginFlag, navigate, B2BToken]);

  return <Loading />;
}
