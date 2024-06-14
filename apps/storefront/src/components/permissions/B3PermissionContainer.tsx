import { checkPermissionCode } from '@/utils';

interface PermissionCodesProps {
  code: string;
  permissionLevel?: number | string;
}

interface B2BPermissionContainerProps {
  permissions: PermissionCodesProps;
  type: string;
  no?: null | React.ReactNode;
  children: React.ReactNode;
  permissionsList: PermissionCodesProps[];
}

const B2BPermissionContainer = (props: B2BPermissionContainerProps) => {
  const { permissions, children, no = null, type, permissionsList } = props;

  const isAllowed = checkPermissionCode(permissions, type, permissionsList);

  return isAllowed ? children : no;
};

export default B2BPermissionContainer;
