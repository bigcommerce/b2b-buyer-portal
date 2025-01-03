import { useEffect, useMemo, useState } from 'react';

import { permissionLevels } from '@/constants';
import { useAppSelector } from '@/store';
import {
  levelComparison,
  validateBasePermissionWithComparisonType,
  ValidatePermissionWithComparisonTypeProps,
  VerifyLevelPermissionProps,
} from '@/utils';

export const useVerifyLevelPermission = ({
  code,
  companyId = 0,
  userEmail = '',
  userId = 0,
}: VerifyLevelPermissionProps) => {
  const [isVerified, setIsVerified] = useState(false);

  const { selectCompanyHierarchyId } = useAppSelector(
    ({ company }) => company.companyHierarchyInfo,
  );
  const { companyInfo, customer, permissions } = useAppSelector(({ company }) => company);

  useEffect(() => {
    const info = permissions.find((permission) => permission.code.includes(code));

    if (!info) return;

    const { permissionLevel } = info;

    if (!permissionLevel) return;

    setIsVerified(
      levelComparison({
        permissionLevel: +permissionLevel,
        customer,
        companyInfo,
        params: {
          companyId,
          userEmail,
          userId,
        },
      }),
    );
  }, [
    selectCompanyHierarchyId,
    code,
    companyId,
    userEmail,
    userId,
    companyInfo,
    customer,
    permissions,
  ]);

  return [isVerified];
};

export const useValidatePermissionWithComparisonType = ({
  level = 0,
  code = '',
  containOrEqual = 'equal',
}: ValidatePermissionWithComparisonTypeProps) => {
  const { permissions } = useAppSelector(({ company }) => company);

  const [isValidate, setIsValidate] = useState(false);

  useEffect(() => {
    if (!permissions?.length) return;

    const isPermissions = validateBasePermissionWithComparisonType({
      level,
      code,
      containOrEqual,
      permissions,
    });
    setIsValidate(isPermissions);
  }, [permissions, level, code, containOrEqual]);

  return [isValidate];
};

export const useVerifyCreatePermission = (code: string) => {
  const { selectCompanyHierarchyId } = useAppSelector(
    ({ company }) => company.companyHierarchyInfo,
  );
  const level = useMemo(() => {
    return selectCompanyHierarchyId ? permissionLevels.COMPANY_SUBSIDIARIES : permissionLevels.USER;
  }, [selectCompanyHierarchyId]);

  const [isValidate] = useValidatePermissionWithComparisonType({
    code,
    level,
    containOrEqual: 'contain',
  });

  return [isValidate];
};
