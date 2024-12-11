import { permissionLevels } from '@/constants';
import { store } from '@/store';

import { getPermissionsInfo } from '../b3CheckPermissions';

interface VerifyPermissionProps {
  code: string;
  userId: number;
  selectId?: number;
  userEmail?: string;
}

export const verifyShoppingListUserAndSubsidiariesPermission = ({
  code,
  userId = 0,
  selectId,
  userEmail = '',
}: VerifyPermissionProps): boolean => {
  const info = getPermissionsInfo(code);
  const selectCompanyHierarchyId =
    selectId || store.getState()?.company?.companyHierarchyInfo?.selectCompanyHierarchyId || 0;

  const { customer } = store.getState().company || {};
  const customerId = customer?.id;
  const customerB2BId = customer?.b2bId || 0;
  const customerEmail = customer?.emailAddress;
  if (!info) return false;

  const { permissionLevel } = info;
  switch (permissionLevel) {
    case permissionLevels.COMPANY_SUBSIDIARIES:
      return true;
    case permissionLevels.USER:
      return selectCompanyHierarchyId
        ? false
        : userId === +customerId || userId === +customerB2BId || userEmail === customerEmail;
    default:
      return false;
  }
};
