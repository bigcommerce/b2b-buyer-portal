import { permissionLevels } from '@/constants';
import { checkPermissionCode, verifyCompanyLevelPermission } from '@/utils/b3CheckPermissions/base';

import { B2BPermissionParams, b2bPermissionsList } from '../b3RolePermissions/config';

interface PermissionsCodesProps {
  code: string;
  permissionLevel: number;
}

const pdpButtonAndOthersPermission = [
  'purchasabilityPermission',
  'quotesActionsPermission',
  'shoppingListActionsPermission',
];

export const getCorrespondsConfigurationPermission = (
  permissions: PermissionsCodesProps[],
  selectCompanyHierarchyId: number,
) => {
  const keys = Object.keys(b2bPermissionsList);

  const newB3PermissionsList: Record<string, string> = b2bPermissionsList;

  return keys.reduce((acc, cur: string) => {
    const param = {
      code: newB3PermissionsList[cur],
    };

    const item = checkPermissionCode(param, 'every', permissions || []);

    if (pdpButtonAndOthersPermission.includes(cur)) {
      const isPdpButtonAndOthersPermission = verifyCompanyLevelPermission({
        code: newB3PermissionsList[cur],
        containOrEqual: 'contain',
        level: selectCompanyHierarchyId
          ? permissionLevels.COMPANY_SUBSIDIARIES
          : permissionLevels.USER,
        permissions,
      });

      return {
        ...acc,
        [cur]: isPdpButtonAndOthersPermission,
      };
    }

    return {
      ...acc,
      [cur]: item,
    };
  }, {} as B2BPermissionParams);
};
