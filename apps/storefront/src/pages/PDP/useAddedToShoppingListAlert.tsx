import { useB3Lang } from '@b3/lang';
import { Box, Button } from '@mui/material';

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
    globalSnackbar.success('Products were added to your shopping list', {
      jsx: () => (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Box
            sx={{
              mr: '15px',
              mb: '8px',
            }}
          >
            {b3Lang('pdp.notification.productsAdded')}
          </Box>
          <Button
            onClick={() => gotoShoppingDetail(id)}
            variant="text"
            sx={{
              textWrap: 'nowrap',
              color: '#ffffff',
              padding: 0,
              mx: 3,
              my: 3,
            }}
          >
            {b3Lang('pdp.notification.viewShoppingList')}
          </Button>
        </Box>
      ),
      isClose: true,
    });
  };
}
