import { checkPermissionCode } from '@/utils';

interface PermissionCodesProps {
  code: string;
  permissionLevel?: number | string;
}

interface B3PermissionContainerProps {
  permissions: PermissionCodesProps;
  type: string;
  no?: null | React.ReactNode;
  children: React.ReactNode;
  permissionsList: PermissionCodesProps[];
}

const B3PermissionContainer = (props: B3PermissionContainerProps) => {
  const { permissions, children, no = null, type, permissionsList } = props;

  const isAllowed = checkPermissionCode(permissions, type, permissionsList);

  return isAllowed ? children : no;
};

export default B3PermissionContainer;
