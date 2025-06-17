import { ReactNode } from 'react';
import { useB3Lang } from '@b3/lang';
import { Box, Button } from '@mui/material';

import { useAppSelector } from '@/store';
import { globalSnackbar, platform } from '@/utils';

function CatalystButton({
  goToShoppingDetail,
  children,
}: {
  goToShoppingDetail: () => void | undefined;
  children: ReactNode;
}) {
  return (
    <Button
      onClick={() => goToShoppingDetail()}
      variant="text"
      sx={{
        color: '#000',
        padding: 0,
        fontWeight: 800,
        textTransform: 'none',
      }}
    >
      {children}
    </Button>
  );
}

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
              mr: platform === 'catalyst' ? '52px' : '15px',
            }}
          >
            {b3Lang('pdp.notification.productsAdded')}
          </Box>
          {platform === 'catalyst' ? (
            <CatalystButton goToShoppingDetail={() => gotoShoppingDetail(id)}>
              {b3Lang('pdp.notification.viewShoppingList')}
            </CatalystButton>
          ) : (
            <Button
              onClick={() => gotoShoppingDetail(id)}
              variant="text"
              sx={{
                color: '#ffffff',
                padding: 0,
              }}
            >
              {b3Lang('pdp.notification.viewShoppingList')}
            </Button>
          )}
        </Box>
      ),
      isClose: true,
    });
  };
}
