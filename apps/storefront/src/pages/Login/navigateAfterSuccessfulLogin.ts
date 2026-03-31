import { type NavigateFunction } from 'react-router-dom';

import { PATH_ROUTES } from '@/constants';
import { CustomerRole, UserTypes } from '@/types';
import { b2bJumpPath } from '@/utils/b3CheckPermissions/b2bPermissionPath';
import { loginJump } from '@/utils/b3Login';
import { CustomerInfo } from '@/utils/loginInfo';

export function navigateAfterSuccessfulLogin(
  navigate: NavigateFunction,
  info: CustomerInfo | undefined,
  quoteDetailToCheckoutUrl: string,
): void {
  if (quoteDetailToCheckoutUrl) {
    navigate(quoteDetailToCheckoutUrl);
    return;
  }
  if (info?.userType === UserTypes.MULTIPLE_B2C && info?.role === CustomerRole.SUPER_ADMIN) {
    navigate('/dashboard');
    return;
  }

  const isLoginLandLocation = loginJump(navigate);

  if (!isLoginLandLocation) return;

  if (info?.userType === UserTypes.B2C) {
    navigate(PATH_ROUTES.ORDERS);
  }

  const path = b2bJumpPath(Number(info?.role));

  navigate(path);
}
