import { Box } from '@mui/material';

import B3Dialog from '@/components/B3Dialog';
import { useMobile } from '@/hooks/useMobile';
import { useB3Lang } from '@/lib/lang';

interface ShoppingDetailDeleteItemsProps {
  open: boolean;
  handleCancelClick: () => void;
  handleDeleteProductClick: () => void;
}

function ShoppingDetailDeleteItems({
  open,
  handleCancelClick,
  handleDeleteProductClick,
}: ShoppingDetailDeleteItemsProps) {
  const b3Lang = useB3Lang();
  const [isMobile] = useMobile();

  return (
    <B3Dialog
      isOpen={open}
      title={b3Lang('shoppingList.deleteItems.subtotal')}
      leftSizeBtn={b3Lang('shoppingList.deleteItems.cancel')}
      rightSizeBtn={b3Lang('shoppingList.deleteItems.delete')}
      handleLeftClick={handleCancelClick}
      handRightClick={handleDeleteProductClick}
      rightStyleBtn={{ color: '#D32F2F' }}
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
