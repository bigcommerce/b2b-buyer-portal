import { permissionLevels } from '@/constants';
import { store } from '@/store';

import {
  checkPermissionCode,
  levelComparison,
  validateBasePermissionWithComparisonType,
} from './base';

export interface PermissionCodesProps {
  code: string;
  permissionLevel?: number | string;
}

export interface VerifyLevelPermissionProps {
  code: string;
  companyId?: number;
  userEmail?: string;
  userId?: number;
}

export interface ValidatePermissionWithComparisonTypeProps {
  level?: number;
  code?: string;
  containOrEqual?: 'contain' | 'equal';
  permissions?: PermissionCodesProps[];
}

interface VerifyPermissionProps {
  code: string;
  userId: number;
  selectId: number;
}

export const checkEveryPermissionsCode = (permission: PermissionCodesProps) => {
  const newPermissions = store.getState().company.permissions || [];

  return checkPermissionCode(permission, 'every', newPermissions);
};

export const checkOneOfPermissionsCode = (permission: PermissionCodesProps) => {
  const newPermissions = store.getState().company.permissions || [];

  return checkPermissionCode(permission, 'some', newPermissions);
};

export const getPermissionsInfo = (code: string): PermissionCodesProps | undefined => {
  const permissions = store.getState().company.permissions || [];

  return permissions.find((permission) => permission.code.includes(code));
};

export const validatePermissionWithComparisonType = ({
  level = 0,
  code = '',
  containOrEqual = 'equal',
  permissions = [],
}: ValidatePermissionWithComparisonTypeProps): boolean => {
  const newPermissions =
    permissions && permissions.length ? permissions : store.getState().company.permissions || [];

  return validateBasePermissionWithComparisonType({
    level,
    code,
    containOrEqual,
    permissions: newPermissions,
  });
};

export const verifyCreatePermission = (
  code: string,
  selectCompanyHierarchyId?: number,
  permissions?: PermissionCodesProps[],
): boolean => {
  return validatePermissionWithComparisonType({
    code,
    containOrEqual: 'contain',
    level: selectCompanyHierarchyId ? permissionLevels.COMPANY_SUBSIDIARIES : permissionLevels.USER,
    permissions,
  });
};

/**
 * Verifies the user's permission level based on the provided criteria.
 *
 * @param {Object} params - The function parameters.
 * @param {string} params.code - The permission code to check.
 * @param {number} params.companyId - The ID of the company to compare, default is 0.
 * @param {string} params.userEmail - The email of the user to compare. Either `userEmail` or `userId` is required for user-level validation.
 * @param {number} params.userId - The ID of the user to compare. Either `userEmail` or `userId` is required for user-level validation.
 * @returns {boolean} - Returns `true` if permission is granted, `false` otherwise.
 */
export const verifyLevelPermission = ({
  code,
  companyId = 0,
  userEmail = '',
  userId = 0,
}: VerifyLevelPermissionProps): boolean => {
  const info = getPermissionsInfo(code);

  if (!info) return !!info;

  const { permissionLevel } = info;

  if (!permissionLevel) return false;

  const salesRepCompanyId = store.getState().b2bFeatures.masqueradeCompany.id;

  if (salesRepCompanyId) return true;

  const { companyInfo, customer } = store.getState().company || {};

  return levelComparison({
    permissionLevel: +permissionLevel,
    customer,
    companyInfo,
    params: {
      companyId,
      userEmail,
      userId,
    },
  });
};

export const verifySubmitShoppingListSubsidiariesPermission = ({
  code,
  userId = 0,
  selectId,
}: VerifyPermissionProps): boolean => {
  const info = getPermissionsInfo(code);

  if (!info) return !!info;

  const submitShoppingListPermission = verifyLevelPermission({
    code,
    userId,
  });

  return info.permissionLevel === permissionLevels.USER && selectId
    ? false
    : submitShoppingListPermission;
};
