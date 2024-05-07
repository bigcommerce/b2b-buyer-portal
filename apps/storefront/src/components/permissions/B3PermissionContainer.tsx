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
}

const B3PermissionContainer = (props: B3PermissionContainerProps) => {
  const { permissions, children, no = null, type } = props;

  const isAllowed = checkPermissionCode(permissions, type);

  return isAllowed ? children : no;
};

export default B3PermissionContainer;
