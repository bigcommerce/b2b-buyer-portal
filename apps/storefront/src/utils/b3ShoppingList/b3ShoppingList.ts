import { createB2BShoppingList, createBcShoppingList } from '@/shared/service/b2b';

import { getB3PermissionsList } from '../b3RolePermissions';
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
    const { submitShoppingListPermission } = getB3PermissionsList();
    createShoppingData.status = submitShoppingListPermission ? 30 : 0;
  } else {
    createShoppingData.channelId = channelId;
  }

  return createSL({ ...createShoppingData, channelId });
};

export default createShoppingList;
