import {
  useRef,
  useState,
  useEffect,
  useContext,
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
} from '@mui/material'

import {
  TableColumnItem,
  B3Table,
} from '@/components/B3Table'

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

interface OrderDialogProps<T> {
  title?: string,
  open: boolean,
  columnItems: TableColumnItem<T>[],
  listItems: Array<any>,
  confirmText?: string,
  // handleClose?: () => void,
  handleConfirm: () => void,
  setOpen: (open: boolean) => void,
  products?: any,
  type?: string,
  currentDialogData: any,
  itemKey: string,
}

export const OrderDialog: <T>(props: OrderDialogProps<T>) => ReactElement = ({
  title,
  open,
  columnItems,
  listItems,
  // confirmText,
  products,
  type,
  currentDialogData,
  // handleClose,
  handleConfirm,
  setOpen,
  itemKey,
}) => {
  const container = useRef<HTMLInputElement | null>(null)
  const [isOpenCreateShopping, setOpenCreateShopping] = useState(false)

  const [openShoppingList, setOpenShoppingList] = useState(false)

  const [isMobile] = useMobile()

  //   name: 'reOrder',
  // name: 'return',
  // name: 'shippingList',

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
            {/* <B3Table
            columnItems={columnItems}
            listItems={listItems}
            showPagination={false}
          /> */}
            <OrderCheckboxProduct
              products={products}
            />
          </DialogContent>

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
