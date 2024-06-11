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

  if (isB2BUser) {
    return createB2BShoppingList({
      ...createShoppingData,
      status: +role === 2 ? 30 : 0,
    });
  }

  return createBcShoppingList({ ...createShoppingData, channelId });
};

export default createShoppingList;
