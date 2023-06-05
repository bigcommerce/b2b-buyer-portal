import {
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import globalB3 from '@b3/global-b3'
import type { OpenPageState } from '@b3/hooks'
import { Box, Button } from '@mui/material'

import { GlobaledContext } from '@/shared/global'
import {
  addProductToBcShoppingList,
  addProductToShoppingList,
  searchB2BProducts,
  searchBcProducts,
} from '@/shared/service/b2b'
import { globalStateSelector } from '@/store'
// import {
//   OptionListProduct,
// } from '@/types/products'
import {
  B3SStorage,
  getDefaultCurrencyInfo,
  globalSnackbar,
  isAllRequiredOptionFilled,
  snackbar,
} from '@/utils'

import { conversionProductsList } from '../../utils/b3Product/shared/config'
import CreateShoppingList from '../orderDetail/components/CreateShoppingList'
import OrderShoppingList from '../orderDetail/components/OrderShoppingList'

interface PDPProps {
  setOpenPage: Dispatch<SetStateAction<OpenPageState>>
}

export const serialize = (form: any) => {
  const arr: any = {}
  for (let i = 0; i < form.elements.length; i += 1) {
    const file: any = form.elements[i]
    switch (file.type) {
      case undefined:
      case 'button':
      case 'file':
      case 'reset':
      case 'hidden':
        break
      case 'submit':
        break
      case 'checkbox':
        if (file.checked) {
          arr[file.name] = file.value
        }
        break
      case 'radio':
        if (!file.checked) {
          break
        } else {
          arr[file.name] = file.value
          break
        }
      default:
        if (arr[file.name]) {
          arr[file.name] = `${arr[file.name]},${file.value}`
        } else {
          arr[file.name] = file.value
        }
    }
  }
  return arr
}

export const getProductOptionList = (optionMap: CustomFieldItems) => {
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

function PDP({ setOpenPage }: PDPProps) {
  const isPromission = true
  const {
    state: {
      isB2BUser,
      shoppingListClickNode,
      customer: { customerGroupId },
    },
  } = useContext(GlobaledContext)

  const [openShoppingList, setOpenShoppingList] = useState<boolean>(false)
  const [isOpenCreateShopping, setIsOpenCreateShopping] =
    useState<boolean>(false)

  const [isRequestLoading, setIsRequestLoading] = useState<boolean>(false)

  const navigate = useNavigate()
  const { setOpenPageFn } = useSelector(globalStateSelector)

  useEffect(() => {
    setOpenShoppingList(true)
  }, [])

  const handleShoppingClose = () => {
    setOpenShoppingList(false)
    setIsOpenCreateShopping(false)
    navigate('/')
    setOpenPageFn({
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

  const tip = (id: string | number) => (
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
        Products were added to your shopping list
      </Box>
      <Button
        onClick={() => gotoShoppingDetail(id)}
        variant="text"
        sx={{
          color: '#ffffff',
        }}
      >
        view shopping list
      </Button>
    </Box>
  )

  const handleShoppingConfirm = async (id: string | number) => {
    if (!shoppingListClickNode) return
    const productView: HTMLElement | null = shoppingListClickNode.closest(
      globalB3['dom.productView']
    )
    if (!productView) return

    try {
      setIsRequestLoading(true)
      const productId = (
        productView.querySelector('input[name=product_id]') as any
      )?.value
      const qty =
        (productView.querySelector('[name="qty[]"]') as any)?.value ?? 1
      const sku = (
        productView.querySelector('[data-product-sku]')?.innerHTML ?? ''
      ).trim()
      const form = productView.querySelector('form[data-cart-item-add]')

      const { currency_code: currencyCode } = getDefaultCurrencyInfo()

      const companyId =
        B3SStorage.get('B3CompanyInfo')?.id ||
        B3SStorage.get('salesRepCompanyId')
      const getProducts = isB2BUser ? searchB2BProducts : searchBcProducts

      const { productsSearch } = await getProducts({
        productIds: [+productId],
        currencyCode,
        companyId,
        customerGroupId,
      })

      const newProductInfo: any = conversionProductsList(productsSearch)
      const { allOptions, variants } = newProductInfo[0]

      const variantItem = variants.find((item: any) => item.sku === sku)

      const optionMap = serialize(form)

      const optionList = getProductOptionList(optionMap)

      const { isValid, message } = isAllRequiredOptionFilled(
        allOptions,
        optionList
      )
      if (!isValid) {
        snackbar.error(message, {
          isClose: true,
        })
        return
      }

      const params = {
        productId: +productId,
        variantId: variantItem?.variant_id,
        quantity: +qty,
        optionList,
      }

      const addToShoppingList = isB2BUser
        ? addProductToShoppingList
        : addProductToBcShoppingList

      await addToShoppingList({
        shoppingListId: +id,
        items: [params],
      })
      globalSnackbar.success('Products were added to your shopping list', {
        jsx: () => tip(id),
        isClose: true,
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
          dialogTitle="Add to shopping list"
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
