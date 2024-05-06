import { useEffect, useState } from 'react';

import { useAppSelector } from '@/store';
import { CustomerRole } from '@/types';

interface UseMonitorBrowserBackProps {
  isOpen: boolean;
}

const useMonitorBrowserBack = ({ isOpen }: UseMonitorBrowserBackProps) => {
  const role = useAppSelector(({ company }) => company.customer.role);
  const history = window.location;
  const isLogin = role !== CustomerRole.GUEST;

  const [isEnterB2BBuyerPortal, setIsEnterB2BBuyerPortal] = useState(false);

  useEffect(() => {
    if (isOpen && !history.hash.includes('/pdp')) {
      setIsEnterB2BBuyerPortal(true);
    }

    if (!isOpen && isLogin && isEnterB2BBuyerPortal) {
      window.location.reload();
      setIsEnterB2BBuyerPortal(false);
    }
    // disabling to avoid unnecessary renders when adding the missing dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history.href]);
};

export default useMonitorBrowserBack;
