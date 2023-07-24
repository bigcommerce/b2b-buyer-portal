import { useContext, useState } from 'react'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import { Box, Card, CardContent, Divider, Typography } from '@mui/material'

import { B3Upload, CustomButton } from '@/components'
import {
  addProductToBcShoppingList,
  addProductToShoppingList,
} from '@/shared/service/b2b'
import { B3SStorage, snackbar } from '@/utils'

import { getAllModifierDefaultValue } from '../../../utils/b3Product/shared/config'
import { ShoppingListDetailsContext } from '../context/ShoppingListDetailsContext'

import QuickAdd from './QuickAdd'
import SearchProduct from './SearchProduct'

interface AddToListProps {
  updateList: () => void
  isB2BUser: boolean
}

export default function AddToShoppingList(props: AddToListProps) {
  const {
    state: { id },
  } = useContext(ShoppingListDetailsContext)

  const { updateList, isB2BUser } = props

  const [isOpenBulkLoadCSV, setIsOpenBulkLoadCSV] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const addItemsToShoppingList = isB2BUser
    ? addProductToShoppingList
    : addProductToBcShoppingList

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
      isClose: true,
    })

    return res
  }

  const quickAddToList = async (products: CustomFieldItems[]) => {
    const items = products.map((product) => ({
      optionList: product.newSelectOptionList || product.optionList,
      productId: parseInt(product.productId, 10) || 0,
      quantity: product.quantity,
      variantId: parseInt(product.variantId, 10) || 0,
    }))

    const res: CustomFieldItems = await addItemsToShoppingList({
      shoppingListId: id,
      items,
    })

    snackbar.success('Products were added to your shopping list', {
      isClose: true,
    })

    return res
  }

  const getValidProducts = (products: CustomFieldItems) => {
    const notPurchaseSku: string[] = []
    const productItems: CustomFieldItems[] = []
    const notAddAble: string[] = []

    products.forEach((item: CustomFieldItems) => {
      const { products: currentProduct, qty } = item
      const {
        option,
        purchasingDisabled,
        variantSku,
        variantId,
        productId,
        modifiers,
      } = currentProduct

      const defaultModifiers = getAllModifierDefaultValue(modifiers)
      if (purchasingDisabled) {
        notPurchaseSku.push(variantSku)
        return
      }

      const notPassedModifier = defaultModifiers.filter(
        (modifier: CustomFieldItems) => !modifier.isVerified
      )
      if (notPassedModifier.length > 0) {
        notAddAble.push(variantSku)

        return
      }

      const optionsList = option.map((item: CustomFieldItems) => ({
        optionId: `attribute[${item.option_id}]`,
        optionValue: item.id.toString(),
      }))

      defaultModifiers.forEach((modifier: CustomFieldItems) => {
        const { type } = modifier

        if (type === 'date') {
          const { defaultValue } = modifier
          Object.keys(defaultValue).forEach((key) => {
            optionsList.push({
              optionId: `attribute[${modifier.option_id}][${key}]`,
              optionValue: `${modifier.defaultValue[key]}`,
            })
          })
        } else {
          optionsList.push({
            optionId: `attribute[${modifier.option_id}]`,
            optionValue: `${modifier.defaultValue}`,
          })
        }
      })

      productItems.push({
        productId: parseInt(productId, 10) || 0,
        variantId: parseInt(variantId, 10) || 0,
        quantity: +qty,
        optionList: optionsList,
      })
    })

    return {
      notPurchaseSku,
      productItems,
      notAddAble,
    }
  }

  const handleCSVAddToList = async (productsData: CustomFieldItems) => {
    setIsLoading(true)
    try {
      const { validProduct } = productsData

      const { notPurchaseSku, productItems, notAddAble } =
        getValidProducts(validProduct)

      if (productItems.length > 0) {
        await quickAddToList(productItems)

        updateList()
      }

      if (notAddAble.length > 0) {
        snackbar.error(`SKU ${notAddAble} cannot be added quickly`, {
          isClose: true,
        })
      }

      if (notPurchaseSku.length > 0) {
        snackbar.error(
          `SKU ${notPurchaseSku} cannot be purchased in online store.`,
          {
            isClose: true,
          }
        )
      }

      setIsOpenBulkLoadCSV(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenUploadDiag = () => {
    const blockPendingAccountViewPrice = B3SStorage.get(
      'blockPendingAccountViewPrice'
    )
    if (blockPendingAccountViewPrice) {
      snackbar.info(
        'Your business account is pending approval. This feature is currently disabled.'
      )
    } else {
      setIsOpenBulkLoadCSV(true)
    }
  }

  return (
    <Card
      sx={{
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

          <QuickAdd updateList={updateList} quickAddToList={quickAddToList} />

          <Divider />

          <Box
            sx={{
              margin: '20px 0 0',
            }}
          >
            <CustomButton variant="text" onClick={() => handleOpenUploadDiag()}>
              <UploadFileIcon
                sx={{
                  marginRight: '8px',
                }}
              />
              Bulk upload CSV
            </CustomButton>
          </Box>

          <B3Upload
            isOpen={isOpenBulkLoadCSV}
            setIsOpen={setIsOpenBulkLoadCSV}
            handleAddToList={handleCSVAddToList}
            isLoading={isLoading}
            withModifiers
          />
        </Box>
      </CardContent>
    </Card>
  )
}
