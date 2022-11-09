import {
  useRef,
  useState,
  ReactElement,
} from 'react'

import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Box,
  Typography,
  Button,
  Divider,
} from '@mui/material'

import {
  useMobile,
} from '@/hooks'

import {
  OrderCheckboxProduct,
} from './OrderCheckboxProduct'

import {
  OrderShoppingList,
} from './OrderShoppingList'
import CreateShoppingList from './CreateShoppingList'

interface OrderDialogProps {
  open: boolean,
  confirmText?: string,
  setOpen: (open: boolean) => void,
  products?: any,
  type?: string,
  currentDialogData: any,
  itemKey: string,
}

export const OrderDialog: (props: OrderDialogProps) => ReactElement = ({
  open,
  products,
  type,
  currentDialogData,
  setOpen,
  itemKey,
}) => {
  const container = useRef<HTMLInputElement | null>(null)
  const [isOpenCreateShopping, setOpenCreateShopping] = useState(false)

  const [openShoppingList, setOpenShoppingList] = useState(false)

  const [isMobile] = useMobile()

  const handleClose = () => {
    setOpen(false)
  }

  const handleSaveClick = () => {
    if (type === 'shippingList') {
      handleClose()
      setOpenShoppingList(true)
    }
  }

  const handleCreateShoppingClick = () => {
    setOpenCreateShopping(false)
    setOpenShoppingList(true)
  }

  const handleShoppingClose = () => {
    setOpenShoppingList(false)
  }

  const handleShoppingConfirm = () => {
    setOpenShoppingList(false)
  }

  const handleOpenCreateDialog = () => {
    setOpenShoppingList(false)
    setOpenCreateShopping(true)
  }

  const handleCloseShoppingClick = () => {
    setOpenCreateShopping(false)
    setOpenShoppingList(true)
  }

  return (
    <>
      <Box
        sx={{
          ml: 3,
          cursor: 'pointer',
          width: '50%',
        }}
      >
        <Box
          ref={container}
        />

        <Dialog
          open={open}
          fullWidth
          container={container.current}
          onClose={handleClose}
          fullScreen={isMobile}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle
            id="alert-dialog-title"
            sx={{
              borderBottom: '1px solid #D9DCE9',
            }}
          >
            {currentDialogData.dialogTitle}
          </DialogTitle>
          <DialogContent>
            <Typography
              sx={{
                margin: '1rem 0',
              }}
            >
              {currentDialogData.description}
            </Typography>
            <OrderCheckboxProduct
              products={products}
            />
          </DialogContent>

          <Divider />

          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button
              onClick={handleSaveClick}
              autoFocus
            >
              {currentDialogData.confirmText}
            </Button>
          </DialogActions>
        </Dialog>

      </Box>
      {
        itemKey === 'order-summary' && (
        <OrderShoppingList
          isOpen={openShoppingList}
          dialogTitle="Add to shopping list"
          onClose={handleShoppingClose}
          onConfirm={handleShoppingConfirm}
          onCreate={handleOpenCreateDialog}
        />
        )
      }
      {
        itemKey === 'order-summary' && (
        <CreateShoppingList
          open={isOpenCreateShopping}
          onChange={handleCreateShoppingClick}
          onClose={handleCloseShoppingClick}
        />
        )
      }
    </>
  )
}
