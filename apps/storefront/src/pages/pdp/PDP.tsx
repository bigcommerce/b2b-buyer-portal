import {
  useEffect,
  useState,
  Dispatch,
  SetStateAction,
} from 'react'

import type {
  OpenPageState,
} from '@b3/hooks'

import {
  B3SStorage,
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

  const [openShoppingList, setOpenShoppingList] = useState<boolean>(false)
  const [isOpenCreateShopping, setIsOpenCreateShopping] = useState<boolean>(false)

  const [isRequestLoading, setIsRequestLoading] = useState<boolean>(false)

  useEffect(() => {
    setOpenShoppingList(true)
  }, [])

  const handleShoppingClose = () => {
    setOpenShoppingList(false)
    setIsOpenCreateShopping(false)
    setOpenPage({
      isOpen: false,
    })
  }
  const handleShoppingConfirm = async (id: string | number) => {
    try {
      setIsRequestLoading(true)
      const productId = (document.querySelector('input[name=product_id]') as any)?.value
      const qty = (document.querySelector('[name="qty[]"]') as any)?.value ?? 1
      const sku = (document.querySelector('[data-product-sku]')?.innerHTML ?? '').trim()

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
      handleShoppingClose()
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
