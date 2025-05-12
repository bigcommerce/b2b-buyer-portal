import { useEffect, useState } from 'react';

import { getB2BShoppingList, getBcShoppingList } from '@/shared/service/b2b';
import { isB2BUserSelector, rolePermissionSelector, useAppSelector } from '@/store';
import { ShoppingListStatus } from '@/types';
import { channelId } from '@/utils';

export const useShoppingLists = () => {
  const [list, setList] = useState<never[]>([]);
  const [isLoading, setLoading] = useState<boolean>(false);
  const isB2BUser = useAppSelector(isB2BUserSelector);
  const b2bPermissions = useAppSelector(rolePermissionSelector);

  useEffect(() => {
    const fetchShoppingLists = async () => {
      setLoading(true);
      try {
        const { edges: list = [] } = isB2BUser
          ? await getB2BShoppingList()
          : await getBcShoppingList({ channelId });

        if (!isB2BUser) {
          setList(list);
        } else {
          const { submitShoppingListPermission } = b2bPermissions;

          const newList = list.filter(
            (item: CustomFieldItems) =>
              item.node.status ===
              Number(
                submitShoppingListPermission
                  ? ShoppingListStatus.Draft
                  : ShoppingListStatus.Approved,
              ),
          );
          setList(newList);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchShoppingLists();
  }, [b2bPermissions, isB2BUser]);

  return { list, isLoading };
};
