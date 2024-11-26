import { checkEveryPermissionsCode } from '../b3CheckPermissions';

import { B2BPermissionParams, b2bPermissionsList } from './config';

interface PermissionLevelInfoProps {
  permissionType: string;
  permissionLevel?: number | string;
}

const getB3PermissionsList = (
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

export default getB3PermissionsList;
