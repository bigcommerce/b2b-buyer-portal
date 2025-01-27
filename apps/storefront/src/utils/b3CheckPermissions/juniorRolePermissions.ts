import { store } from '@/store';

import { getCorrespondsConfigurationPermission } from './base';

export const setCartPermissions = (isLoggedInAndB2BAccount: boolean) => {
  const permissions = store.getState()?.company?.permissions || [];

  const selectCompanyHierarchyId =
    store.getState()?.company?.companyHierarchyInfo?.selectCompanyHierarchyId || 0;

  const { purchasabilityPermission } = getCorrespondsConfigurationPermission(
    permissions,
    Number(selectCompanyHierarchyId),
  );

  if (!purchasabilityPermission && isLoggedInAndB2BAccount) return;
  const style = document.getElementById('b2bPermissions-cartElement-id');
  if (style) {
    style.remove();
  }
};
