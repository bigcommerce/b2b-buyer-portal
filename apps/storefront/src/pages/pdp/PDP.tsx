import {
  useEffect,
  useState,
  Dispatch,
  SetStateAction,
  useRef,
} from 'react'

import {
  Button,
  Box,
} from '@mui/material'

import type {
  OpenPageState,
} from '@b3/hooks'

import {
  useNavigate,
} from 'react-router-dom'
import {
  B3SStorage,
  snackbar,
} from '@/utils'

import {
  searchB2BProducts,
  addProductToShoppingList,
} from '@/shared/service/b2b'

import {
  OrderShoppingList,
} from '../orderDetail/components/OrderShoppingList'

import CreateShoppingList from '../orderDetail/components/CreateShoppingList'

interface PDPProps {
  setOpenPage: Dispatch<SetStateAction<OpenPageState>>,
}

interface PDPRefProps {
  timer: null | number,
}

const serialize = (form: any) => {
  const arr: any = {}
  for (let i = 0; i < form.elements.length; i += 1) {
    const file: any = form.elements[i]
    switch (file.type) {
      case undefined:
      case 'button':
      case 'file':
      case 'reset':
      case 'submit':
        break
      case 'checkbox':
      case 'radio':
        if (!file.checked) {
          break
        } else {
          if (arr[file.name]) {
            arr[file.name] = `${arr[file.name]},${file.value}`
          } else {
            arr[file.name] = file.value
          }
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

const getProductOptionList = (optionMap: any) => {
  const optionList: any = []
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

const PDP = ({
  setOpenPage,
}: PDPProps) => {
  const isPromission = true

  const pdpRef = useRef<PDPRefProps>({
    timer: null,
  })

  const [openShoppingList, setOpenShoppingList] = useState<boolean>(false)
  const [isOpenCreateShopping, setIsOpenCreateShopping] = useState<boolean>(false)

  const [isRequestLoading, setIsRequestLoading] = useState<boolean>(false)

  const navigate = useNavigate()

  useEffect(() => {
    setOpenShoppingList(true)
  }, [])

  const handleShoppingClose = (isTrue?: boolean) => {
    if (isTrue) {
      setOpenShoppingList(false)
      setIsOpenCreateShopping(false)
      pdpRef.current.timer = window.setTimeout(() => {
        setOpenPage({
          isOpen: false,
        })
      }, 4000)
    } else {
      setOpenShoppingList(false)
      setIsOpenCreateShopping(false)
      setOpenPage({
        isOpen: false,
      })
    }
  }

  const gotoShoppingDetail = (id: string | number) => {
    if (pdpRef.current?.timer) clearTimeout(pdpRef.current.timer)
    navigate(`/shoppingList/${id}`)
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
        Products are added to shopping list

      </Box>
      <Button
        onClick={() => gotoShoppingDetail(id)}
        variant="text"
      >
        view shoppping list
      </Button>
    </Box>
  )

  const handleShoppingConfirm = async (id: string | number) => {
    try {
      setIsRequestLoading(true)
      const productId = (document.querySelector('input[name=product_id]') as any)?.value
      const qty = (document.querySelector('[name="qty[]"]') as any)?.value ?? 1
      const sku = (document.querySelector('[data-product-sku]')?.innerHTML ?? '').trim()
      // const productId = '97'
      // const qty = '1'
      // const sku = 'TWB'
      const form = document.querySelector('form[data-cart-item-add]')

      const getDefaultCurrencyInfo = () => {
        const currencies = B3SStorage.get('currencies')
        if (currencies) {
          const {
            currencies: currencyArr,
          } = currencies
          const defaultCurrency = currencyArr.find((currency: any) => currency.is_default)
          return defaultCurrency
        }
      }

      const {
        currency_code: currencyCode,
      } = getDefaultCurrencyInfo()

      const companyId = B3SStorage.get('B3CompanyInfo')?.id || B3SStorage.get('salesRepCompanyId')

      const {
        productsSearch,
      } = await searchB2BProducts({
        productIds: [+productId],
        currencyCode,
        companyId,
      })

      const variantItem = productsSearch[0].variants.find((item: any) => item.sku === sku)

      const optionMap = serialize(form)

      const optionList = getProductOptionList(optionMap)
      const params = {
        productId: +productId,
        variantId: variantItem.variant_id,
        quantity: +qty,
        optionList,
      }

      await addProductToShoppingList({
        shoppingListId: +id,
        items: [params],
      })
      snackbar.success('Products are added to shopping list', {
        jsx: () => tip(id),
        isClose: true,
      })
      handleShoppingClose(true)
    } finally {
      setOpenShoppingList(false)
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
      {
      isPromission && (
      <OrderShoppingList
        isOpen={openShoppingList}
        dialogTitle="Add to shopping list"
        onClose={handleShoppingClose}
        onConfirm={handleShoppingConfirm}
        onCreate={handleOpenCreateDialog}
        isLoading={isRequestLoading}
        setLoading={setIsRequestLoading}
      />
      )
    }
      {
      isPromission && (
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

export default PDP
