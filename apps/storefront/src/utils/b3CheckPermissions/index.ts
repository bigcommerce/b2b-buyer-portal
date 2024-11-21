import { permissionLevels } from '@/constants';
import { store } from '@/store';
import { CustomerRole } from '@/types';

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
  level: number;
  code?: string;
  containOrEqual?: 'contain' | 'equal';
}

export const verifyCompanyLevelPermissionByCode = ({
  level = 0,
  code = '',
  containOrEqual = 'equal',
}: VerifyCompanyLevelPermissionByCodeProps): boolean => {
  if (!code) return false;

  const getFirstCode = code.includes(',') ? code.split(',')[0].trim() : code;

  const info = getPermissionsInfo(getFirstCode);

  if (!info) return !!info;

  const { permissionLevel = 0 } = info;

  if (containOrEqual === 'equal') return permissionLevel === level;

  return +permissionLevel >= +level;
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
  const isAgenting = store.getState().b2bFeatures?.masqueradeCompany?.isAgenting || false;
  const { companyInfo, customer } = store.getState().company || {};
  const salesRepCompanyId = store.getState().b2bFeatures?.masqueradeCompany?.id || 0;

  const currentCompanyId =
    customer.role === CustomerRole.SUPER_ADMIN && isAgenting ? +salesRepCompanyId : companyInfo?.id;
  const customerId = customer?.id;
  const customerB2BId = customer?.b2bId || 0;
  const customerEmail = customer?.emailAddress;

  switch (permissionLevel) {
    case permissionLevels.COMPANYSUBSIDIARIES:
      return true;
    case permissionLevels.COMPANY:
      return +companyId === +currentCompanyId;
    case permissionLevels.USER:
      return userId === +customerId || userId === +customerB2BId || userEmail === customerEmail;
    default:
      return false;
  }
};
