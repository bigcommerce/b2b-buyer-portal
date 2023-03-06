import {
  Box,
  Divider,
  Typography,
  Button,
  Card,
  CardContent,
  Link,
} from '@mui/material'

import UploadFileIcon from '@mui/icons-material/UploadFile'

import {
  useState,
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
  addProductToBcShoppingList,
} from '@/shared/service/b2b'

import {
  snackbar,
} from '@/utils'

import {
  B3Upload,
} from '@/components'

interface AddToListProps {
  updateList: () => void
  isB2BUser: boolean
}

export const AddToShoppingList = (props: AddToListProps) => {
  const {
    state: {
      id,
    },
  } = useContext(ShoppingListDetailsContext)

  const {
    updateList,
    isB2BUser,
  } = props

  const [isOpenBulkLoadCSV, setIsOpenBulkLoadCSV] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const addItemsToShoppingList = isB2BUser ? addProductToShoppingList : addProductToBcShoppingList

  const addToList = async (products: CustomFieldItems[]) => {
    const items = products.map((product) => ({
      optionList: product.newSelectOptionList,
      productId: product.id,
      quantity: product.quantity,
      variantId: product.variantId,
    }))

    const res: CustomFieldItems = await addItemsToShoppingList({
      shoppingListId: id,
      items,
    })

    snackbar.success('Products were added to your shopping list', {
      duration: 5000,
    })

    return res
  }

  const quickAddToList = async (products: CustomFieldItems[]) => {
    const items = products.map((product) => ({
      optionList: product.newSelectOptionList,
      productId: parseInt(product.productId, 10) || 0,
      quantity: product.quantity,
      variantId: parseInt(product.variantId, 10) || 0,
    }))

    const res: CustomFieldItems = await addItemsToShoppingList({
      shoppingListId: id,
      items,
    })

    snackbar.success('Products were added to your shopping list', {
      duration: 5000,
    })

    return res
  }

  const limitProductTips = (data: any) => (
    <>
      <p style={{
        margin: 0,
      }}
      >
        {`SKU ${data.variantSku} is not enough stock`}
      </p>
      <p style={{
        margin: 0,
      }}
      >
        {`Available amount - ${data.AvailableAmount}.`}
      </p>
    </>
  )

  const outOfStockProductTips = (outOfStock: CustomFieldItems, fileErrorsCSV: string) => (
    <>
      <p style={{
        margin: 0,
      }}
      >
        {`SKU ${outOfStock} are out of stock.`}
      </p>
      <Link
        href={fileErrorsCSV}
        sx={{
          color: '#FFFFFF',
        }}
      >
        Download errors csv
      </Link>
    </>
  )

  const handleCSVAddToList = async (validProduct: CustomFieldItems) => {
    setIsLoading(true)
    try {
      const {
        notPurchaseSku,
        productItems,
        limitProduct,
        minLimitQuantity,
        maxLimitQuantity,
        outOfStock,
        stockErrorFile,
      } = validProduct

      if (productItems.length > 0) {
        await quickAddToList(productItems)

        updateList()
      }

      if (limitProduct.length > 0) {
        limitProduct.forEach((item: CustomFieldItems) => {
          snackbar.warning('', {
            jsx: () => limitProductTips(item),
          })
        })
      }

      if (notPurchaseSku.length > 0) {
        snackbar.error(`SKU ${notPurchaseSku} cannot be purchased in online store.`)
      }

      if (outOfStock.length > 0 && stockErrorFile) {
        snackbar.error('', {
          jsx: () => outOfStockProductTips(outOfStock, stockErrorFile),
        })
      }

      if (minLimitQuantity.length > 0) {
        minLimitQuantity.forEach((data: CustomFieldItems) => {
          snackbar.error(`You need to purchase a minimum of ${data.minQuantity} of the ${data.variantSku} per order.`)
        })
      }

      if (maxLimitQuantity.length > 0) {
        maxLimitQuantity.forEach((data: CustomFieldItems) => {
          snackbar.error(`You need to purchase a maximum of ${data.maxQuantity} of the ${data.variantSku} per order.`)
        })
      }

      setIsOpenBulkLoadCSV(false)
    } finally {
      setIsLoading(false)
    }
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
            isB2BUser={isB2BUser}
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
            <Button
              variant="text"
              onClick={() => {
                setIsOpenBulkLoadCSV(true)
              }}
            >
              <UploadFileIcon sx={{
                marginRight: '8px',
              }}
              />
              Bulk upload CSV
            </Button>
          </Box>

          <B3Upload
            isOpen={isOpenBulkLoadCSV}
            setIsOpen={setIsOpenBulkLoadCSV}
            handleAddToList={handleCSVAddToList}
            isLoading={isLoading}
          />
        </Box>
      </CardContent>
    </Card>
  )
}
