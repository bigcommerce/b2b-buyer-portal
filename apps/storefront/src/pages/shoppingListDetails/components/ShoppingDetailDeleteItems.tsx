import { useB3Lang } from '@b3/lang'
import { Box } from '@mui/material'

import { B3Dialog } from '@/components'
import { useMobile } from '@/hooks'

interface ShoppingDetailDeleteItemsProps {
  open: boolean
  handleCancelClick: () => void
  handleDeleteProductClick: () => void
}

function ShoppingDetailDeleteItems(props: ShoppingDetailDeleteItemsProps) {
  const b3Lang = useB3Lang()
  const [isMobile] = useMobile()
  const { open, handleCancelClick, handleDeleteProductClick } = props

  return (
    <B3Dialog
      isOpen={open}
      title={b3Lang('shoppingListDetails.deleteItems.subtotal')}
      leftSizeBtn={b3Lang('shoppingListDetails.deleteItems.cancel')}
      rightSizeBtn={b3Lang('shoppingListDetails.deleteItems.delete')}
      handleLeftClick={handleCancelClick}
      handRightClick={handleDeleteProductClick}
      rightStyleBtn={{
        color: '#D32F2F',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: `${isMobile ? 'center%' : 'start'}`,
          width: `${isMobile ? '100%' : '450px'}`,
          height: '100%',
        }}
      >
        {b3Lang('shoppingListDetails.deleteItems.confirmDelete')}
      </Box>
    </B3Dialog>
  )
}

export default ShoppingDetailDeleteItems
