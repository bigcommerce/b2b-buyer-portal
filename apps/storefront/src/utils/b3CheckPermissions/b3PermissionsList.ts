import { PATH_ROUTES } from '@/constants';
import { CustomerRole } from '@/types';

import { checkEveryPermissionsCode } from './check';
import { B2BPermissionParams, b2bPermissionsList } from './config';

interface PermissionLevelInfoProps {
  permissionType: string;
  permissionLevel?: number | string;
}

export const getB3PermissionsList = (
  permissionLevelInfo?: PermissionLevelInfoProps[],
): B2BPermissionParams => {
  const keys = Object.keys(b2bPermissionsList);
  return keys.reduce((acc, cur: string) => {
    const param: {
      code: string;
      permissionLevel?: number | string;
    } = {
      code: (b2bPermissionsList as Record<string, string>)[cur],
    };

    if (permissionLevelInfo && permissionLevelInfo.length > 0) {
      const currentPermission = permissionLevelInfo.find(
        (item: PermissionLevelInfoProps) => item.permissionType === cur,
      );

      if (currentPermission) {
        param.permissionLevel = currentPermission.permissionLevel;
      }
    }

    const item = checkEveryPermissionsCode(param);

    return {
      ...acc,
      [cur]: item,
    };
  }, {} as B2BPermissionParams);
};

const currentB2BExitsRoute = (): string => {
  const { getShoppingListPermission, getOrderPermission } = getB3PermissionsList();

  if (getOrderPermission) return PATH_ROUTES.ORDERS;

  if (getShoppingListPermission) return PATH_ROUTES.SHOPPING_LISTS;

  return PATH_ROUTES.ACCOUNT_SETTINGS;
};

export const b2bGotoRoute = (role: number): string => {
  const path =
    role === CustomerRole.JUNIOR_BUYER ? PATH_ROUTES.SHOPPING_LISTS : currentB2BExitsRoute();

  return path;
};
