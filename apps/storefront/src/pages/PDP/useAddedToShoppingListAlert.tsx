import { useB3Lang } from '@/lib/lang';
import { useAppSelector } from '@/store';
import { globalSnackbar } from '@/utils';

export function useAddedToShoppingListAlert() {
  const b3Lang = useB3Lang();
  const setOpenPage = useAppSelector(({ global }) => global.setOpenPageFn);

  const gotoShoppingDetail = (id: string) =>
    setOpenPage?.({
      isOpen: true,
      openUrl: `/shoppingList/${id}`,
      params: {
        shoppingListBtn: 'add',
      },
    });

  return (id: string) => {
    globalSnackbar.success(b3Lang('shoppingList.addToShoppingList.productsAdded'), {
      action: {
        label: b3Lang('pdp.notification.viewShoppingList'),
        onClick: () => gotoShoppingDetail(id),
      },
    });
  };
}
