import {
  Dispatch,
  lazy,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from 'react'
import { useNavigate } from 'react-router-dom'
import globalB3 from '@b3/global-b3'
import type { OpenPageState } from '@b3/hooks'
import { LangFormatFunction, useB3Lang } from '@b3/lang'
import { Box, Button } from '@mui/material'

import { GlobaledContext } from '@/shared/global'
import {
  addProductToBcShoppingList,
  addProductToShoppingList,
  searchB2BProducts,
  searchBcProducts,
} from '@/shared/service/b2b'
import { store, useAppSelector } from '@/store'
import {
  getDefaultCurrencyInfo,
  getValidOptionsList,
  globalSnackbar,
  isAllRequiredOptionFilled,
  serialize,
} from '@/utils'

import { conversionProductsList } from '../../utils/b3Product/shared/config'

const CreateShoppingList = lazy(
  () => import('../orderDetail/components/CreateShoppingList')
)

const OrderShoppingList = lazy(
  () => import('../orderDetail/components/OrderShoppingList')
)

interface PDPProps {
  setOpenPage: Dispatch<SetStateAction<OpenPageState>>
}
interface AddProductsToShoppingListParams {
  isB2BUser: boolean
  items: CustomFieldItems[]
  shoppingListId: number | string
  gotoShoppingDetail: (id: number | string) => void
  customerGroupId?: number
  b3Lang: LangFormatFunction
}

export const getProductOptionList = (optionMap: CustomFieldItems = {}) => {
  const optionList: CustomFieldItems[] = []
  Object.keys(optionMap).forEach((item) => {
    if (item.includes('attribute') && item.match(/\[([0-9]+)\]/g)) {
      optionList.push({
        optionId: item,
        optionValue: optionMap[item],
      })
    }
  })
  return optionList
}

const tip = (
  id: number | string,
  gotoShoppingDetail: (id: number | string) => void,
  b3Lang: LangFormatFunction
) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
    }}
  >
    <Box
      sx={{
        mr: '15px',
      }}
    >
      {b3Lang('pdp.notification.productsAdded')}
    </Box>
    <Button
      onClick={() => gotoShoppingDetail(id)}
      variant="text"
      sx={{
        color: '#ffffff',
        padding: 0,
      }}
    >
      {b3Lang('pdp.notification.viewShoppingList')}
    </Button>
  </Box>
)

export const addProductsToShoppingList = async ({
  isB2BUser,
  customerGroupId,
  items,
  shoppingListId,
  gotoShoppingDetail,
  b3Lang,
}: AddProductsToShoppingListParams) => {
  const { currency_code: currencyCode } = getDefaultCurrencyInfo()
  const { id: companyId } = store.getState().company.companyInfo
  const getProducts = isB2BUser ? searchB2BProducts : searchBcProducts

  const { productsSearch } = await getProducts({
    productIds: items.map(({ productId }) => productId),
    currencyCode,
    companyId,
    customerGroupId,
  })

  const productsInfo = conversionProductsList(productsSearch)
  const products = []
  let isError = false

  for (let index = 0; index < productsInfo.length; index += 1) {
    const { allOptions: requiredOptions, variants } = productsInfo[index]
    const {
      productId,
      sku,
      variantId: vId,
      quantity,
      optionSelections,
    } = items[index]
    // check if it's an specified product
    const variantId =
      vId ||
      variants.find((item: { sku: string }) => item.sku === sku)?.variant_id
    // get selected options by inputed data
    const optionList = getProductOptionList(optionSelections)
    // verify inputed data includes required data
    const { isValid, message } = isAllRequiredOptionFilled(
      requiredOptions,
      optionList
    )

    if (!isValid) {
      isError = true
      globalSnackbar.error(message, {
        isClose: true,
      })
      break
    }

    const newOptionLists = getValidOptionsList(optionList, productsInfo[index])
    products.push({
      productId,
      variantId,
      quantity,
      optionList: newOptionLists,
    })
  }

  if (isError) return

  const addToShoppingList = isB2BUser
    ? addProductToShoppingList
    : addProductToBcShoppingList

  await addToShoppingList({
    shoppingListId,
    items: products,
  })
  globalSnackbar.success('Products were added to your shopping list', {
    jsx: () => tip(shoppingListId, gotoShoppingDetail, b3Lang),
    isClose: true,
  })
}

function PDP({ setOpenPage }: PDPProps) {
  const isPromission = true
  const {
    state: { isB2BUser, shoppingListClickNode },
  } = useContext(GlobaledContext)
  const customerGroupId = useAppSelector(
    ({ company }) => company.customer.customerGroupId
  )
  const platform = useAppSelector(({ global }) => global.storeInfo.platform)
  const setOpenPageFn = useAppSelector(({ global }) => global.setOpenPageFn)
  const b3Lang = useB3Lang()

  const [openShoppingList, setOpenShoppingList] = useState<boolean>(false)
  const [isOpenCreateShopping, setIsOpenCreateShopping] =
    useState<boolean>(false)

  const [isRequestLoading, setIsRequestLoading] = useState<boolean>(false)

  const navigate = useNavigate()

  useEffect(() => {
    setOpenShoppingList(true)
  }, [])

  const handleShoppingClose = () => {
    setOpenShoppingList(false)
    setIsOpenCreateShopping(false)
    navigate('/')
    setOpenPageFn?.({
      isOpen: false,
      openUrl: '',
    })
  }

  const gotoShoppingDetail = (id: string | number) => {
    setOpenPage({
      isOpen: true,
      openUrl: `/shoppingList/${id}`,
      params: {
        shoppingListBtn: 'add',
      },
    })
  }

  const getShoppingListItem = () => {
    if (platform !== 'bigcommerce') {
      const {
        itemFromCurrentPage: [product],
      } = window.b2b.utils.shoppingList
      return product
    }

    if (!shoppingListClickNode) return undefined

    const productView: HTMLElement | null = shoppingListClickNode.closest(
      globalB3['dom.productView']
    )
    if (!productView) return undefined

    const productId = (
      productView.querySelector('input[name=product_id]') as any
    )?.value
    const quantity =
      (productView.querySelector('[name="qty[]"]') as any)?.value ?? 1
    const sku = (
      productView.querySelector('[data-product-sku]')?.innerHTML ?? ''
    ).trim()
    const form = productView.querySelector(
      'form[data-cart-item-add]'
    ) as HTMLFormElement
    return {
      productId: +productId,
      sku,
      quantity: +quantity,
      optionSelections: serialize(form),
    }
  }

  const handleShoppingConfirm = async (shoppingListId: string) => {
    const product = getShoppingListItem()

    if (!product) return
    try {
      setIsRequestLoading(true)
      await addProductsToShoppingList({
        isB2BUser,
        customerGroupId,
        shoppingListId,
        items: [product],
        gotoShoppingDetail,
        b3Lang,
      })

      handleShoppingClose()
    } finally {
      setIsRequestLoading(false)
    }
  }
  const handleOpenCreateDialog = () => {
    setOpenShoppingList(false)
    setIsOpenCreateShopping(true)
  }

  const handleCloseShoppingClick = () => {
    setIsOpenCreateShopping(false)
    setOpenShoppingList(true)
  }

  const handleCreateShoppingClick = () => {
    handleCloseShoppingClick()
    setOpenShoppingList(true)
  }

  return (
    <>
      {isPromission && (
        <OrderShoppingList
          isOpen={openShoppingList}
          dialogTitle={b3Lang('pdp.addToShoppingList')}
          onClose={handleShoppingClose}
          onConfirm={handleShoppingConfirm}
          onCreate={handleOpenCreateDialog}
          isLoading={isRequestLoading}
          setLoading={setIsRequestLoading}
        />
      )}
      {isPromission && (
        <CreateShoppingList
          open={isOpenCreateShopping}
          onChange={handleCreateShoppingClick}
          onClose={handleCloseShoppingClick}
        />
      )}
    </>
  )
}

export default PDP
