import { store } from '@/store';

import { checkPermissionCode } from './base';

interface PermissionCodesProps {
  code: string;
  permissionLevel?: number | string;
}

export const checkEveryPermissionsCode = (permission: PermissionCodesProps) => {
  const newPermissions = store.getState().company.permissions || [];

  return checkPermissionCode(permission, 'every', newPermissions);
};

export const checkOneOfPermissionsCode = (permission: PermissionCodesProps) => {
  const newPermissions = store.getState().company.permissions || [];

  return checkPermissionCode(permission, 'some', newPermissions);
};
