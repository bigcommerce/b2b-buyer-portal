import { createB2BShoppingList, createBcShoppingList } from '@/shared/service/b2b';

import { channelId } from '../basicConfig';

interface CreateShoppingListParams {
  data: { name: string; description: string };
  isB2BUser: boolean;
  role: number;
}

const createShoppingList = ({ data, isB2BUser, role }: CreateShoppingListParams) => {
  const createShoppingData: Record<string, string | number> = data;
  if (data.description.indexOf('\n') > -1) {
    createShoppingData.description = data.description.split('\n').join('\\n');
  }
  const createSL = isB2BUser ? createB2BShoppingList : createBcShoppingList;

  if (isB2BUser) {
    createShoppingData.status = +role === 2 ? 30 : 0;
  } else {
    createShoppingData.channelId = channelId;
  }

  return createSL(createShoppingData);
};

export default createShoppingList;
