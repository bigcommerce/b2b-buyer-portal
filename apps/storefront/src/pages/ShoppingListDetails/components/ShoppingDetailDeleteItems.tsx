import { Box } from '@mui/material';

import B3Dialog from '@/components/B3Dialog';
import { useMobile } from '@/hooks';
import { useB3Lang } from '@/lib/lang';

interface ShoppingDetailDeleteItemsProps {
  open: boolean;
  handleCancelClick: () => void;
  handleDeleteProductClick: () => void;
}

function ShoppingDetailDeleteItems(props: ShoppingDetailDeleteItemsProps) {
  const b3Lang = useB3Lang();
  const [isMobile] = useMobile();
  const { open, handleCancelClick, handleDeleteProductClick } = props;

  return (
    <B3Dialog
      handRightClick={handleDeleteProductClick}
      handleLeftClick={handleCancelClick}
      isOpen={open}
      leftSizeBtn={b3Lang('shoppingList.deleteItems.cancel')}
      rightSizeBtn={b3Lang('shoppingList.deleteItems.delete')}
      rightStyleBtn={{
        color: '#D32F2F',
      }}
      title={b3Lang('shoppingList.deleteItems.subtotal')}
    >
      <Box
        sx={{
          display: 'flex',
          width: isMobile ? '100%' : '450px',
          height: '100%',
        }}
      >
        {b3Lang('shoppingList.deleteItems.confirmDelete')}
      </Box>
    </B3Dialog>
  );
}

export default ShoppingDetailDeleteItems;
