import {
  Box,
  Divider,
  Typography,
  Button,
  Card,
  CardContent,
} from '@mui/material'

import UploadFileIcon from '@mui/icons-material/UploadFile'

import {
  useContext,
} from 'react'

import {
  SearchProduct,
} from './SearchProduct'

import {
  QuickAdd,
} from './QuickAdd'

import {
  ShoppingListDetailsContext,
} from '../context/ShoppingListDetailsContext'

import {
  addProductToShoppingList,
} from '@/shared/service/b2b'

import {
  snackbar,
} from '@/utils'

interface AddToListProps {
  updateList: () => void
}

export const AddToShoppingList = (props: AddToListProps) => {
  const {
    state: {
      id,
    },
  } = useContext(ShoppingListDetailsContext)

  const {
    updateList,
  } = props

  const addToList = async (products: CustomFieldItems[]) => {
    const items = products.map((product) => ({
      optionList: product.newSelectOptionList,
      productId: product.id,
      quantity: product.quantity,
      variantId: product.variantId,
    }))

    const res: CustomFieldItems = await addProductToShoppingList({
      shoppingListId: id,
      items,
    })

    snackbar.success('Product were added to your shopping list')

    return res
  }

  const quickAddToList = async (products: CustomFieldItems[]) => {
    const items = products.map((product) => ({
      optionList: product.newSelectOptionList,
      productId: parseInt(product.productId, 10) || 0,
      quantity: product.quantity,
      variantId: parseInt(product.variantId, 10) || 0,
    }))

    const res: CustomFieldItems = await addProductToShoppingList({
      shoppingListId: id,
      items,
    })

    snackbar.success('Products were added to your shopping list')

    return res
  }

  return (
    <Card sx={{
      marginBottom: '50px',
    }}
    >
      <CardContent>
        <Box>
          <Typography variant="h5">Add to list</Typography>
          <SearchProduct
            updateList={updateList}
            addToList={addToList}
          />

          <Divider />

          <QuickAdd
            updateList={updateList}
            quickAddToList={quickAddToList}
          />

          <Divider />

          <Box sx={{
            margin: '20px 0 0',
          }}
          >
            <Button variant="text">
              <UploadFileIcon sx={{
                marginRight: '8px',
              }}
              />
              Bulk upload CSV
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}
