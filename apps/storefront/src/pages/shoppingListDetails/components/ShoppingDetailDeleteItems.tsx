import { Box } from '@mui/material'

import { B3Dialog } from '@/components'
import { useMobile } from '@/hooks'

interface ShoppingDetailDeleteItemsProps {
  open: boolean
  handleCancelClick: () => void
  handleDeleteProductClick: () => void
}

function ShoppingDetailDeleteItems(props: ShoppingDetailDeleteItemsProps) {
  const [isMobile] = useMobile()
  const { open, handleCancelClick, handleDeleteProductClick } = props

  return (
    <B3Dialog
      isOpen={open}
      title="Delete product"
      leftSizeBtn="cancel"
      rightSizeBtn="delete"
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
        Are you sure you want to delete this product?
      </Box>
    </B3Dialog>
  )
}

export default ShoppingDetailDeleteItems
