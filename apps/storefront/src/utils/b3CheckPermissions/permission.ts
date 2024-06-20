import { checkPermissionCode } from './base';

interface PermissionCodesProps {
  code: string;
  permissionLevel?: number | string;
}

export const checkEveryPermissionsCode = (
  permission: PermissionCodesProps,
  permissions: PermissionCodesProps[],
) => checkPermissionCode(permission, 'every', permissions);

export const checkOneOfPermissionsCode = (
  permission: PermissionCodesProps,
  permissions: PermissionCodesProps[],
) => {
  return checkPermissionCode(permission, 'some', permissions);
};
