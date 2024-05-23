import { checkEveryPermissionsCode } from '../b3CheckPermissions';

import { b3PermissionsList, B3Permissionsparms } from './config';

interface PermissionLevelInfoProps {
  permissionType: string;
  permissionLevel?: number | string;
}

const getB3PermissionsList = (
  permissionLevelInfo?: PermissionLevelInfoProps[],
): B3Permissionsparms => {
  const keys = Object.keys(b3PermissionsList);
  return keys.reduce((acc, cur: string) => {
    const param: {
      code: string;
      permissionLevel?: number | string;
    } = {
      code: (b3PermissionsList as Record<string, string>)[cur],
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
  }, {} as B3Permissionsparms);
};

export default getB3PermissionsList;
