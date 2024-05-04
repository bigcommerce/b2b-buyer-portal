import { useContext, useState } from 'react'
import { CallbackKey, useCallbacks } from '@b3/hooks'
import { useB3Lang } from '@b3/lang'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import { Box, Card, CardContent, Divider, Typography } from '@mui/material'

import { B3Upload } from '@/components'
import CustomButton from '@/components/button/CustomButton'
import { useBlockPendingAccountViewPrice } from '@/hooks'
import {
  addProductToBcShoppingList,
  addProductToShoppingList,
} from '@/shared/service/b2b'
import { useAppSelector } from '@/store'
import { snackbar } from '@/utils'
import { getValidOptionsList } from '@/utils/b3Product/b3Product'

import { getAllModifierDefaultValue } from '../../../utils/b3Product/shared/config'
import { ShoppingListDetailsContext } from '../context/ShoppingListDetailsContext'

import QuickAdd from './QuickAdd'
import SearchProduct from './SearchProduct'

interface AddToListProps {
  updateList: () => void
  isB2BUser: boolean
  type?: string
}

export default function AddToShoppingList(props: AddToListProps) {
  const {
    state: { id },
  } = useContext(ShoppingListDetailsContext)

  const companyStatus = useAppSelector(
    ({ company }) => company.companyInfo.status
  )
  const { updateList, isB2BUser, type: pageType = '' } = props
  const b3Lang = useB3Lang()

  const [isOpenBulkLoadCSV, setIsOpenBulkLoadCSV] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [blockPendingAccountViewPrice] = useBlockPendingAccountViewPrice()

  const addItemsToShoppingList = isB2BUser
    ? addProductToShoppingList
    : addProductToBcShoppingList

  const addToList = useCallbacks(
    CallbackKey.onAddToShoppingList,
    async (products: CustomFieldItems[], handleEvent) => {
      try {
        if (!handleEvent(products)) {
          throw new Error()
        }

        const items = products.map((product) => {
          const newOptionLists = getValidOptionsList(
            product.newSelectOptionList,
            product
          )
          return {
            optionList: newOptionLists,
            productId: product.id,
            quantity: product.quantity,
            variantId: product.variantId,
          }
        })

        const res: CustomFieldItems = await addItemsToShoppingList({
          shoppingListId: id,
          items,
        })

        snackbar.success(
          b3Lang('shoppingList.addToShoppingList.productsAdded'),
          {
            isClose: true,
          }
        )

        return res
      } catch (e: any) {
        if (e.message.length > 0) {
          snackbar.error(e.message, { isClose: true })
        }
      }
      return true
    }
  )

  const quickAddToList = async (products: CustomFieldItems[]) => {
    const items = products.map((product) => {
      const newOptionLists = getValidOptionsList(
        product.newSelectOptionList || product.optionList,
        product?.products || product
      )
      return {
        optionList: newOptionLists || [],
        productId: parseInt(product.productId, 10) || 0,
        quantity: product.quantity,
        variantId: parseInt(product.variantId, 10) || 0,
      }
    })

    const res: CustomFieldItems = await addItemsToShoppingList({
      shoppingListId: id,
      items,
    })

    snackbar.success(b3Lang('shoppingList.addToShoppingList.productsAdded'), {
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
      if (purchasingDisabled && pageType !== 'shoppingList') {
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
        products: item.products,
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

      if (notAddAble.length > 0 && pageType !== 'shoppingList') {
        snackbar.error(
          b3Lang('shoppingList.addToShoppingList.skuNotAddable', {
            notAddAble,
          }),
          {
            isClose: true,
          }
        )
      }

      if (notPurchaseSku.length > 0 && pageType !== 'shoppingList') {
        snackbar.error(
          b3Lang('shoppingList.addToShoppingList.skuNotPurchasable', {
            notPurchaseSku,
          }),
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
    if (blockPendingAccountViewPrice && companyStatus === 0) {
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
          <Typography variant="h5">
            {b3Lang('shoppingList.addToShoppingList.addToList')}
          </Typography>
          <SearchProduct
            updateList={updateList}
            addToList={addToList}
            isB2BUser={isB2BUser}
            type="shoppingList"
          />

          <Divider />

          <QuickAdd
            type="shoppingList"
            updateList={updateList}
            quickAddToList={quickAddToList}
          />

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
              {b3Lang('shoppingList.addToShoppingList.bulkUploadCsv')}
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
