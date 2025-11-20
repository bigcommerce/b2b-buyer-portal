import { useEffect, useMemo, useState } from 'react';

import { permissionLevels } from '@/constants';
import { useAppSelector } from '@/store';
import { validateBasePermissionWithComparisonType } from '@/utils/b3CheckPermissions/base';
import { ValidatePermissionWithComparisonTypeProps } from '@/utils/b3CheckPermissions/check';

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

export const useVerifyCreatePermission = (codes: string[]) => {
  const { selectCompanyHierarchyId } = useAppSelector(
    ({ company }) => company.companyHierarchyInfo,
  );

  const { permissions } = useAppSelector(({ company }) => company);
  const level = useMemo(() => {
    return selectCompanyHierarchyId ? permissionLevels.COMPANY_SUBSIDIARIES : permissionLevels.USER;
  }, [selectCompanyHierarchyId]);

  const [permissionInfo, setPermissionsInfo] = useState<boolean[]>([]);

  useEffect(() => {
    if (!permissions?.length) return;

    const info = codes.map((code) => {
      const isPermissions = validateBasePermissionWithComparisonType({
        level,
        code,
        containOrEqual: 'contain',
        permissions,
      });

      return isPermissions;
    });

    setPermissionsInfo(info);
  }, [permissions, level, codes]);

  return permissionInfo;
};
