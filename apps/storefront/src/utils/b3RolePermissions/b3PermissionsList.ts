import { checkEveryPermissionsCode } from '../b3CheckPermissions';

import { b2bPermissionsList, B2BPermissionsparms } from './config';

interface PermissionLevelInfoProps {
  permissionType: string;
  permissionLevel?: number | string;
}

const getB3PermissionsList = (
  permissionLevelInfo?: PermissionLevelInfoProps[],
): B2BPermissionsparms => {
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
  }, {} as B2BPermissionsparms);
};

export default getB3PermissionsList;
