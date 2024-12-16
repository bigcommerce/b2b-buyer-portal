import { store } from '@/store';

import { getCorrespondsConfigurationPermission } from '../b3CheckPermissions/check';

const setCartPermissions = (isLoggedInAndB2BAccount: boolean) => {
  const permissions = store.getState()?.company?.permissions || [];

  const selectCompanyHierarchyId =
    store.getState()?.company?.companyHierarchyInfo?.selectCompanyHierarchyId || 0;

  const { purchasabilityPermission } = getCorrespondsConfigurationPermission(
    permissions,
    +selectCompanyHierarchyId,
  );

  if (!purchasabilityPermission && isLoggedInAndB2BAccount) return;
  const style = document.getElementById('b2bPermissions-cartElement-id');
  if (style) {
    style.remove();
  }
};

export default setCartPermissions;
