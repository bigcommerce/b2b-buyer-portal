import { permissionLevels } from '@/constants';
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

export const getPermissionsInfo = (code: string): PermissionCodesProps | undefined => {
  const permissions = store.getState().company.permissions || [];

  return permissions.find((permission) => permission.code.includes(code));
};

interface VerifyLevelPermissionProps {
  code: string;
  companyId: number;
  userEmail?: string;
  userId?: number;
}

interface VerifyCompanyLevelPermissionByCodeProps {
  level: number | null;
  code?: string;
}

export const verifyCompanyLevelPermissionByCode = ({
  level = null,
  code = '',
}: VerifyCompanyLevelPermissionByCodeProps): boolean => {
  const info = getPermissionsInfo(code);

  if (!code) return false;

  if (!info) return !!info;

  const { permissionLevel } = info;

  return permissionLevel === level;
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
  const getFirstCode = code.includes(',') ? code.split(',')[0].trim() : code;

  const info = getPermissionsInfo(getFirstCode);

  if (!info || !companyId) return !!info;

  const { permissionLevel } = info;
  const { companyInfo, customer } = store.getState().company || {};
  const salesRepCompanyId = store.getState().b2bFeatures?.masqueradeCompany?.id || 0;

  const currentCompanyId = companyInfo?.id || salesRepCompanyId;
  const customerId = customer?.id;
  const customerEmail = customer?.emailAddress;

  switch (permissionLevel) {
    case permissionLevels.COMPANYSUBSIDIARIES:
      return true;
    case permissionLevels.COMPANY:
      return +companyId === +currentCompanyId;
    case permissionLevels.USER:
      return userId === +customerId || userEmail === customerEmail;
    default:
      return false;
  }
};
