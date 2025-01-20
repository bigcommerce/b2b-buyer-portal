import { PATH_ROUTES } from '@/constants';
import { CustomerRole } from '@/types';

import { checkEveryPermissionsCode } from './check';
import { b2bPermissionsMap, B2BPermissionsMapParams } from './config';

const getEnabledB2BPermissionsMap = (): B2BPermissionsMapParams => {
  const keys = Object.keys(b2bPermissionsMap);
  return keys.reduce((acc, cur: string) => {
    const param: {
      code: string;
      permissionLevel?: number | string;
    } = {
      code: (b2bPermissionsMap as Record<string, string>)[cur],
    };

    const item = checkEveryPermissionsCode(param);

    return {
      ...acc,
      [cur]: item,
    };
  }, {} as B2BPermissionsMapParams);
};

const currentB2BExitsPath = (): string => {
  const { getShoppingListPermission, getOrderPermission } = getEnabledB2BPermissionsMap();

  if (getOrderPermission) return PATH_ROUTES.ORDERS;

  if (getShoppingListPermission) return PATH_ROUTES.SHOPPING_LISTS;

  return PATH_ROUTES.ACCOUNT_SETTINGS;
};

export const b2bJumpPath = (role: number): string => {
  const path =
    role === CustomerRole.JUNIOR_BUYER ? PATH_ROUTES.SHOPPING_LISTS : currentB2BExitsPath();

  return path;
};
