interface PermissionCodesProps {
  code: string;
  permissionLevel?: number | string;
}

interface HandleVerifyPermissionCode {
  permission: string;
  permissionLevel?: number | string;
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

export default checkPermissionCode;
