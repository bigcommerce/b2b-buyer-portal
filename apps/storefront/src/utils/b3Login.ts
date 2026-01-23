import { NavigateFunction } from 'react-router-dom';

import { LOGIN_LANDING_LOCATIONS } from '@/constants';
import { store } from '@/store';

import { platform } from './basicConfig';

export const loginJump = (navigate: NavigateFunction, isClearSession = false) => {
  const {
    global: { loginLandingLocation, recordOpenHash, setOpenPageFn },
  } = store.getState();

  if (loginLandingLocation === LOGIN_LANDING_LOCATIONS.HOME && !recordOpenHash) {
    if (platform === 'catalyst') {
      return false;
    }

    if (window.location.href.includes('login.php')) {
      if (isClearSession) {
        window.sessionStorage.clear();
      }

      window.location.href = '/';

      return false;
    }

    navigate('/');
    setOpenPageFn?.({
      isOpen: false,
      openUrl: '',
    });

    if (isClearSession) {
      window.sessionStorage.clear();
    }

    window.location.reload();

    return false;
  }

  if (loginLandingLocation === LOGIN_LANDING_LOCATIONS.HOME && recordOpenHash) {
    if (platform === 'catalyst') {
      return false;
    }

    const hash = recordOpenHash.split('#')[1];

    navigate(hash);

    return false;
  }

  return true;
};
