import { createB2BShoppingList, createBcShoppingList } from '@/shared/service/b2b';
import { store } from '@/store';
import { ShoppingListStatus } from '@/types/shoppingList';

import { b2bPermissionsMap, validatePermissionWithComparisonType } from '../b3CheckPermissions';
import { channelId } from '../basicConfig';

interface CreateShoppingListParams {
  data: { name: string; description: string };
  isB2BUser: boolean;
}

const createShoppingList = ({
  data,
  isB2BUser,
}: // currentChannelId,
CreateShoppingListParams) => {
  const createShoppingData: Record<string, string | number> = data;

  const createSL = isB2BUser ? createB2BShoppingList : createBcShoppingList;

  if (isB2BUser) {
    const submitShoppingListPermission = validatePermissionWithComparisonType({
      containOrEqual: 'contain',
      code: b2bPermissionsMap.submitShoppingListPermission,
    });
    const selectCompanyHierarchyId =
      store.getState()?.company?.companyHierarchyInfo?.selectCompanyHierarchyId || 0;
    createShoppingData.status = submitShoppingListPermission
      ? ShoppingListStatus.Draft
      : ShoppingListStatus.Approved;
    if (selectCompanyHierarchyId) {
      createShoppingData.companyId = selectCompanyHierarchyId;
    }
  } else {
    createShoppingData.channelId = channelId;
  }

  return createSL({ ...createShoppingData, channelId });
};

export default createShoppingList;
