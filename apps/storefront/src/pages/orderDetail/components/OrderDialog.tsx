import {
  useState,
  ReactElement,
  useEffect,
  useContext,
} from 'react'

import {
  Box,
  Typography,
} from '@mui/material'

import {
  useForm,
} from 'react-hook-form'

import {
  addProductToShoppingList,
  addProductToBcShoppingList,
  getB2BVariantInfoBySkus,
  getBcVariantInfoBySkus,
} from '@/shared/service/b2b'

import {
  createCart,
  getCartInfo,
  addProductToCart,
} from '@/shared/service/bc'

import {
  GlobaledContext,
} from '@/shared/global'

import {
  B3CustomForm,
  B3Dialog,
  B3LinkTipContent,
} from '@/components'

import {
  useMobile,
} from '@/hooks'

import {
  snackbar,
} from '@/utils'

import {
  OrderCheckboxProduct,
} from './OrderCheckboxProduct'

import {
  OrderShoppingList,
} from './OrderShoppingList'
import CreateShoppingList from './CreateShoppingList'

import {
  getReturnFormFields,
} from '../shared/config'

import {
  EditableProductItem,
  OrderProductItem,
  OrderCurrency,
} from '../../../types'

interface DialogData {
  dialogTitle: string,
  type: string,
  description: string,
  confirmText: string,
}

interface OrderDialogProps {
  open: boolean,
  setOpen: (open: boolean) => void,
  products?: OrderProductItem[],
  type?: string,
  currentDialogData?: DialogData,
  itemKey: string,
  currencyInfo: OrderCurrency,
}

interface successTipOptions{
  message: string,
  link?: string,
  linkText?: string,
  isOutLink?: boolean,
}

const successTip = (options: successTipOptions) => () => (
  <B3LinkTipContent
    message={options.message}
    link={options.link}
    linkText={options.linkText}
    isOutLink={options.isOutLink}
  />
)

export const OrderDialog: (props: OrderDialogProps) => ReactElement = ({
  open,
  products = [],
  type,
  currentDialogData = null,
  setOpen,
  itemKey,
  currencyInfo,
}) => {
  const {
    state: {
      isB2BUser,
    },
  } = useContext(GlobaledContext)

  const [isOpenCreateShopping, setOpenCreateShopping] = useState(false)

  const [openShoppingList, setOpenShoppingList] = useState(false)
  const [editableProducts, setEditableProducts] = useState<EditableProductItem[]>([])
  const [variantInfoList, setVariantInfoList] = useState<CustomFieldItems[]>([])
  const [isRequestLoading, setIsRequestLoading] = useState(false)
  const [checkedArr, setCheckedArr] = useState<number[]>([])

  const [returnFormFields] = useState(getReturnFormFields())

  const [isMobile] = useMobile()

  const {
    control,
    handleSubmit,
    getValues,
    formState: {
      errors,
    },
    setValue,
  } = useForm({
    mode: 'all',
  })

  const handleClose = () => {
    setOpen(false)
  }

  const handleReturn = () => {
    handleSubmit((data) => {
      console.log(11111, data)
    })()
  }

  const getVariantInfoByList = async () => {
    const skus = products.map((product) => product.sku)
    const getVariantInfoBySku = isB2BUser ? getB2BVariantInfoBySkus : getBcVariantInfoBySkus

    const {
      variantSku: variantInfoList = [],
    }: CustomFieldItems = await getVariantInfoBySku({
      skus,
    })

    setVariantInfoList(variantInfoList)
  }

  const validateProductNumber = (variantInfoList: CustomFieldItems, skus: string[]) => {
    let isValid = true

    skus.forEach((sku) => {
      const variantInfo : CustomFieldItems | null = (variantInfoList || []).find((variant: CustomFieldItems) => variant.variantSku.toUpperCase() === sku.toUpperCase())
      const product = editableProducts.find((product) => product.sku === sku)
      if (!variantInfo || !product) {
        return
      }

      const {
        maxQuantity = 0,
        minQuantity = 0,
        stock = 0,
        isStock = '0',
      } = variantInfo

      const quantity = product?.editQuantity || 1

      if (isStock === '1' && quantity > stock) {
        product.helperText = 'Out of stock'
        isValid = false
      } else if (minQuantity !== 0 && quantity < minQuantity) {
        product.helperText = `Min Quantity ${minQuantity}`
        isValid = false
      } else if (maxQuantity !== 0 && quantity > maxQuantity) {
        product.helperText = `Max Quantity ${maxQuantity}`
        isValid = false
      } else {
        product.helperText = ''
      }
    })

    if (!isValid) {
      setEditableProducts([...editableProducts])
    }

    return isValid
  }

  const handleReorder = async () => {
    setIsRequestLoading(true)

    try {
      const items: CustomFieldItems[] = []
      const skus: string[] = []
      editableProducts.forEach((product) => {
        if (checkedArr.includes(product.variant_id)) {
          items.push({
            quantity: parseInt(`${product.editQuantity}`, 10) || 1,
            productId: product.product_id,
            variantId: product.variant_id,
            optionSelections: (product.optionList || []).map((option) => ({
              optionId: option.optionId,
              optionValue: option.optionValue,
            })),
          })

          skus.push(product.sku)
        }
      })

      if (skus.length <= 0) {
        return
      }

      if (!validateProductNumber(variantInfoList, skus)) {
        snackbar.error('Please fill in the correct quantity')
        return
      }

      const cartInfo = await getCartInfo()
      let res
      if (cartInfo.length > 0) {
        res = await addProductToCart({
          lineItems: items,
        }, cartInfo[0].id)
      } else {
        res = await createCart({
          lineItems: items,
        })
      }
      if (res.status === 422) {
        snackbar.error(res.detail)
      } else {
        setOpen(false)
        snackbar.success('', {
          jsx: successTip({
            message: 'Products are added to cart',
            link: '/cart.php',
            linkText: 'VIEW CART',
            isOutLink: true,
          }),
        })
      }
    } finally {
      setIsRequestLoading(false)
    }
  }

  const handleSaveClick = () => {
    if (type === 'shoppingList') {
      if (checkedArr.length === 0) {
        return
      }
      handleClose()
      setOpenShoppingList(true)
    }

    if (type === 'reOrder') {
      handleReorder()
    }

    if (type === 'return') {
      handleReturn()
    }
  }

  const handleCreateShoppingClick = () => {
    setOpenCreateShopping(false)
    setOpenShoppingList(true)
  }

  const handleShoppingClose = () => {
    setOpenShoppingList(false)
  }

  const handleShoppingConfirm = async (id: string) => {
    setIsRequestLoading(true)
    try {
      const items = editableProducts.map((product) => {
        const {
          product_id: productId,
          variant_id: variantId,
          editQuantity,
          optionList,
        } = product

        return {
          productId: +productId,
          variantId,
          quantity: +editQuantity,
          optionList: optionList.map((option) => {
            const {
              optionId,
              optionValue,
            } = option

            return {
              optionId: `attribute[${optionId}]`,
              optionValue,
            }
          }),
        }
      })
      const params = items.filter((item) => checkedArr.includes(+item.variantId))

      const addToShoppingList = isB2BUser ? addProductToShoppingList : addProductToBcShoppingList

      await addToShoppingList({
        shoppingListId: +id,
        items: params,
      })

      snackbar.success('', {
        jsx: successTip({
          message: 'Products were added to your shopping list',
          link: `/shoppingList/${id}`,
          linkText: 'VIEW SHOPPING LIST',
        }),
      })

      setOpenShoppingList(false)
    } finally {
      setIsRequestLoading(false)
    }
  }

  const handleOpenCreateDialog = () => {
    setOpenShoppingList(false)
    setOpenCreateShopping(true)
  }

  const handleCloseShoppingClick = () => {
    setOpenCreateShopping(false)
    setOpenShoppingList(true)
  }

  useEffect(() => {
    if (open) {
      setEditableProducts(products.map((item: OrderProductItem) => ({
        ...item,
        editQuantity: item.quantity,
      })))

      getVariantInfoByList()
    }
  }, [open])

  const handleProductChange = (products: EditableProductItem[]) => {
    setEditableProducts(products)
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

        <B3Dialog
          isOpen={open}
          fullWidth
          handleLeftClick={handleClose}
          handRightClick={handleSaveClick}
          title={currentDialogData?.dialogTitle || ''}
          rightSizeBtn={currentDialogData?.confirmText || 'Save'}
          maxWidth="lg"
          loading={isRequestLoading}
        >
          <Typography
            sx={{
              margin: isMobile ? '0 0 1rem' : '1rem 0',
            }}
          >
            {currentDialogData?.description || ''}
          </Typography>
          <OrderCheckboxProduct
            products={editableProducts}
            onProductChange={handleProductChange}
            currencyInfo={currencyInfo}
            setCheckedArr={setCheckedArr}
          />

          {
            type === 'return' && (
              <>
                <Typography
                  variant="body1"
                  sx={{
                    margin: '20px 0',
                  }}
                >
                  Additional Information
                </Typography>
                <B3CustomForm
                  formFields={returnFormFields}
                  errors={errors}
                  control={control}
                  getValues={getValues}
                  setValue={setValue}
                />
              </>
            )
          }
        </B3Dialog>
      </Box>
      {
        itemKey === 'order-summary' && (
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
