import { PATH_ROUTES } from '@/constants';
import { CustomerRole } from '@/types';

import { checkEveryPermissionsCode } from './check';
import { b2bPermissionsMap, B2BPermissionsMapParams } from './config';

const hasPermission = (key: keyof B2BPermissionsMapParams): boolean => {
  return checkEveryPermissionsCode(b2bPermissionsMap[key]);
};

export const b2bJumpPath = (role: number): string => {
  if (role === CustomerRole.JUNIOR_BUYER) {
    return PATH_ROUTES.SHOPPING_LISTS;
  }

  if (hasPermission('getOrderPermission')) {
    return PATH_ROUTES.ORDERS;
  }

  if (hasPermission('getShoppingListPermission')) {
    return PATH_ROUTES.SHOPPING_LISTS;
  }

  return PATH_ROUTES.ACCOUNT_SETTINGS;
};
