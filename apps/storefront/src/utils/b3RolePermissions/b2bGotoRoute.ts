import { PATH_ROUTES } from '@/constants';
import { CustomerRole } from '@/types';

import getB3PermissionsList from './b3PermissionsList';

const currentB2BExitsRoute = (): string => {
  const { getShoppingListPermission, getOrderPermission } = getB3PermissionsList();

  if (getOrderPermission) return PATH_ROUTES.ORDERS;

  if (getShoppingListPermission) return PATH_ROUTES.SHOPPING_LISTS;

  return PATH_ROUTES.ACCOUNT_SETTINGS;
};

const b2bGotoRoute = (role: number): string => {
  const path =
    role === CustomerRole.JUNIOR_BUYER ? PATH_ROUTES.SHOPPING_LISTS : currentB2BExitsRoute();

  return path;
};

export default b2bGotoRoute;
