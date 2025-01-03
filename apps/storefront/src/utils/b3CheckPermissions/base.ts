import { permissionLevels } from '@/constants';

import { b2bPermissionsMap, B2BPermissionsMapParams } from './config';

interface PermissionsCodesProp {
  code: string;
  permissionLevel?: number | string;
}

interface HandleVerifyPermissionCode {
  permission: string;
  permissionLevel?: number | string;
  permissions: PermissionsCodesProp[];
}

interface VerifyCompanyLevelPermissionProps {
  level: number;
  code?: string;
  containOrEqual?: 'contain' | 'equal';
  permissions: PermissionsCodesProp[];
}

const pdpButtonAndOthersPermission = [
  'purchasabilityPermission',
  'quotesCreateActionsPermission',
  'quotesUpdateMessageActionsPermission',
  'shoppingListCreateActionsPermission',
  'shoppingListDuplicateActionsPermission',
  'shoppingListUpdateActionsPermission',
  'shoppingListDeleteActionsPermission',
  'shoppingListCreateItemActionsPermission',
  'shoppingListUpdateItemActionsPermission',
  'shoppingListDeleteItemActionsPermission',
];

const handleVerifyPermissionCode = ({
  permission,
  permissionLevel,
  permissions,
}: HandleVerifyPermissionCode) => {
  const permissionInfo = permissions.find((item: { code: string }) => item.code === permission);

  if (!permissionInfo?.code) return false;

  return permissionLevel && permissionInfo?.permissionLevel
    ? +permissionInfo.permissionLevel === +permissionLevel
    : true;
};

export const checkPermissionCode = (
  permissionCodes: PermissionsCodesProp,
  type: string,
  permissions: PermissionsCodesProp[],
) => {
  const { code, permissionLevel = '' } = permissionCodes;

  const codes: string[] = code.split(',').map((item) => item.trim()) || [];

  return type === 'some'
    ? codes.some((permission) =>
        handleVerifyPermissionCode({
          permission,
          permissionLevel,
          permissions,
        }),
      )
    : codes.every((permission) =>
        handleVerifyPermissionCode({
          permission,
          permissionLevel,
          permissions,
        }),
      );
};

export const verifyCompanyLevelPermission = ({
  level = 0,
  code = '',
  containOrEqual = 'equal',
  permissions = [],
}: VerifyCompanyLevelPermissionProps) => {
  if (!code) return false;

  const info = permissions.find((permission) => permission.code.includes(code));

  if (!info) return !!info;

  const { permissionLevel = 0 } = info;

  if (containOrEqual === 'equal') return permissionLevel === level;

  return +permissionLevel >= +level;
};

export const getCorrespondsConfigurationPermission = (
  permissions: PermissionsCodesProp[],
  selectCompanyHierarchyId: number,
) => {
  const keys = Object.keys(b2bPermissionsMap);

  const newB3PermissionsList: Record<string, string> = b2bPermissionsMap;

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
  }, {} as B2BPermissionsMapParams);
};

export default checkPermissionCode;
