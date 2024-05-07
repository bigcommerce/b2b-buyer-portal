import { store } from '@/store';

interface PermissionCodesProps {
  code: string;
  permissionLevel?: number | string;
}

const handleVerifyPermissionCode = (permission: string, permissionLevel?: number | string) => {
  const {
    global: { permissions = [] },
  } = store.getState();

  const permissionInfo = permissions.find((item: { code: string }) => item.code === permission);

  if (!permissionInfo?.code) return false;

  return permissionLevel ? +permissionInfo.permissionLevel === +permissionLevel : true;
};

export const checkPermissionCode = (permissionCodes: PermissionCodesProps, type?: string) => {
  const { code, permissionLevel = '' } = permissionCodes;

  const codes: string[] = code.split(',').map((item) => item.trim()) || [];

  return type === 'some'
    ? codes.some((permission) => handleVerifyPermissionCode(permission, permissionLevel))
    : codes.every((permission) => handleVerifyPermissionCode(permission, permissionLevel));
};

export const checkEveryPermissionsCode = (permission: PermissionCodesProps) =>
  checkPermissionCode(permission, 'every');

export const checkOneOfPermissionsCode = (permission: PermissionCodesProps) =>
  checkPermissionCode(permission, 'some');
