import {
  useRef,
  useState,
  ReactElement,
  useEffect,
  useContext,
} from 'react'

import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Box,
  Typography,
  Button,
  Divider,
} from '@mui/material'

import {
  useForm,
} from 'react-hook-form'

import {
  useMobile,
} from '@/hooks'

import {
  ThemeFrameContext,
} from '@/components/ThemeFrame'

import {
  addProductToShoppingList,
  getB2BVariantInfoBySkus,
} from '@/shared/service/b2b'

import {
  B3CustomForm,
} from '@/components'

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

export const OrderDialog: (props: OrderDialogProps) => ReactElement = ({
  open,
  products = [],
  type,
  currentDialogData = null,
  setOpen,
  itemKey,
  currencyInfo,
}) => {
  const container = useRef<HTMLInputElement | null>(null)
  const [isOpenCreateShopping, setOpenCreateShopping] = useState(false)

  const [openShoppingList, setOpenShoppingList] = useState(false)
  const [editableProducts, setEditableProducts] = useState<EditableProductItem[]>([])
  const [isRequestLoading, setIsRequestLoading] = useState(false)
  const [checkedArr, setCheckedArr] = useState<number[]>([])

  const [isMobile] = useMobile()

  const [returnFormFields] = useState(getReturnFormFields())

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

  const validateProductNumber = (variantInfoList: CustomFieldItems, skus: string[]) => {
    const notStockSku: string[] = []
    const notPurchaseSku: string[] = []

    skus.forEach((sku) => {
      const variantInfo : CustomFieldItems | null = (variantInfoList || []).find((variant: CustomFieldItems) => variant.variantSku.toUpperCase() === sku.toUpperCase())

      if (!variantInfo) {
        return
      }

      const {
        purchasingDisabled = '1',
        maxQuantity,
        minQuantity,
        stock,
      } = variantInfo

      const quantity = editableProducts.find((product) => product.sku === sku)?.editQuantity || 1

      if (purchasingDisabled === '1') {
        notPurchaseSku.push(sku)
        return
      }

      if (quantity > stock || (minQuantity !== 0 && stock < minQuantity) || (maxQuantity !== 0 && quantity > maxQuantity)) {
        notStockSku.push(sku)
      }
    })

    if (notStockSku.length > 0) {
      snackbar.error(`SKU ${notPurchaseSku} not enough inventory`)
      return false
    }

    if (notPurchaseSku.length > 0) {
      snackbar.error(`SKU ${notPurchaseSku} no longer for sale`)
      return false
    }

    return true
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

      const {
        variantSku: variantInfoList,
      }: CustomFieldItems = await getB2BVariantInfoBySkus({
        skus,
      })

      if (!validateProductNumber(variantInfoList, skus)) {
        return
      }

      console.log(33333, items, skus)
    } finally {
      setIsRequestLoading(false)
    }
  }

  const handleSaveClick = () => {
    if (type === 'shoppingList') {
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

      await addProductToShoppingList({
        shoppingListId: +id,
        items: params,
      })

      snackbar.success('Products were added to your shopping list')

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
    }
  }, [open])

  const handleProductChange = (products: EditableProductItem[]) => {
    setEditableProducts(products)
  }

  const IframeDocument = useContext(ThemeFrameContext)
  useEffect(() => {
    if (IframeDocument) {
      IframeDocument.body.style.overflow = open ? 'hidden' : 'initial'
      IframeDocument.body.style.paddingRight = open ? '16px' : '0'
    }
  }, [open, IframeDocument])

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
          maxWidth="lg"
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle
            id="alert-dialog-title"
            sx={{
              borderBottom: '1px solid #D9DCE9',
            }}
          >
            {currentDialogData?.dialogTitle || ''}
          </DialogTitle>
          <DialogContent>
            <Typography
              sx={{
                margin: '1rem 0',
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
          </DialogContent>

          <Divider />

          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button
              onClick={handleSaveClick}
              autoFocus
            >
              {currentDialogData?.confirmText || 'Save'}
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
