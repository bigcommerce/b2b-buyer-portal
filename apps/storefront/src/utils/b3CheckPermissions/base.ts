interface PermissionCodesProps {
  code: string;
  permissionLevel?: number | string;
}

interface HandleVerifyPermissionCode {
  permission: string;
  permissionLevel?: number | string;
  permissions: PermissionCodesProps[];
}

interface VerifyCompanyLevelPermissionProps {
  level: number;
  code?: string;
  containOrEqual?: 'contain' | 'equal';
  permissions: PermissionCodesProps[];
}

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
  permissionCodes: PermissionCodesProps,
  type: string,
  permissions: PermissionCodesProps[],
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
  const getFirstCode = code.includes(',') ? code.split(',')[0].trim() : code;

  const info = permissions.find((permission) => permission.code.includes(getFirstCode));

  if (!info) return !!info;

  const { permissionLevel = 0 } = info;

  if (containOrEqual === 'equal') return permissionLevel === level;

  return +permissionLevel >= +level;
};

export default checkPermissionCode;
