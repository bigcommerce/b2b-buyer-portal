import { useContext, useEffect, useState } from 'react'
import { FieldValues, useForm } from 'react-hook-form'
import { Box, Typography } from '@mui/material'

import { B3CustomForm, B3Dialog, successTip } from '@/components'
import { useMobile } from '@/hooks'
import { GlobaledContext } from '@/shared/global'
import {
  addProductToBcShoppingList,
  addProductToShoppingList,
  getB2BVariantInfoBySkus,
  getBcVariantInfoBySkus,
} from '@/shared/service/b2b'
import { addProductToCart, createCart, getCartInfo } from '@/shared/service/bc'
import { b3TriggerCartNumber, snackbar } from '@/utils'
import { bcBaseUrl } from '@/utils/basicConfig'

import { EditableProductItem, OrderProductItem } from '../../../types'
import getReturnFormFields from '../shared/config'

import CreateShoppingList from './CreateShoppingList'
import OrderCheckboxProduct from './OrderCheckboxProduct'
import OrderShoppingList from './OrderShoppingList'

interface ReturnListProps {
  returnId: number
  returnQty: number
}

interface DialogData {
  dialogTitle: string
  type: string
  description: string
  confirmText: string
}

interface OrderDialogProps {
  open: boolean
  setOpen: (open: boolean) => void
  products?: OrderProductItem[]
  type?: string
  currentDialogData?: DialogData
  itemKey: string
  orderId: number
}

interface ReturnListProps {
  returnId: number
  returnQty: number
}

export default function OrderDialog({
  open,
  products = [],
  type,
  currentDialogData = undefined,
  setOpen,
  itemKey,
  orderId,
}: OrderDialogProps) {
  const {
    state: { isB2BUser },
  } = useContext(GlobaledContext)

  const [isOpenCreateShopping, setOpenCreateShopping] = useState(false)

  const [openShoppingList, setOpenShoppingList] = useState(false)
  const [editableProducts, setEditableProducts] = useState<
    EditableProductItem[]
  >([])
  const [variantInfoList, setVariantInfoList] = useState<CustomFieldItems[]>([])
  const [isRequestLoading, setIsRequestLoading] = useState(false)
  const [checkedArr, setCheckedArr] = useState<number[]>([])
  const [returnArr, setReturnArr] = useState<ReturnListProps[]>([])

  const [returnFormFields] = useState(getReturnFormFields())

  const [isMobile] = useMobile()

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors },
    setValue,
  } = useForm({
    mode: 'all',
  })

  const handleClose = () => {
    setOpen(false)
  }
  const getXsrfToken = (): string | undefined => {
    const cookies = document.cookie
    const cookieArray = cookies.split(';').map((cookie) => cookie.trim())

    const xsrfCookie = cookieArray.find((cookie) =>
      cookie.startsWith('XSRF-TOKEN=')
    )

    if (xsrfCookie) {
      const xsrfToken = xsrfCookie.split('=')[1]
      return decodeURIComponent(xsrfToken)
    }

    return undefined
  }

  const sendReturnRequest = async (
    returnReason: FieldValues,
    returnArr: ReturnListProps[],
    orderId: number
  ) => {
    if (!Object.keys(returnReason).length || !returnArr.length) {
      snackbar.error('Please select at least one item')
      return
    }
    const transformedData = returnArr.reduce((result, item) => {
      const key = `return_qty[${item.returnId}]`
      result[key] = item.returnQty
      return result
    }, returnReason)
    transformedData.authenticity_token = getXsrfToken()
    transformedData.order_id = orderId

    const urlencoded = new URLSearchParams(transformedData)

    const requestOptions: any = {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      referrer: `${bcBaseUrl()}/account.php?action=new_return&order_id=${orderId}`,
      body: urlencoded,
      mode: 'no-cors',
    }

    try {
      setIsRequestLoading(true)
      const returnResult = await fetch(
        `${bcBaseUrl()}/account.php?action=save_new_return`,
        requestOptions
      )
      if (
        returnResult.status === 200 &&
        returnResult.url.includes('saved_new_return')
      ) {
        snackbar.success(
          "The application is successful, please wait for the merchant's review."
        )
      } else {
        snackbar.error('Application failed, please contact the merchant.')
      }
      setIsRequestLoading(false)
      handleClose()
    } catch (err) {
      console.log(err)
    }
  }

  const handleReturn = () => {
    handleSubmit((data) => {
      sendReturnRequest(data, returnArr, orderId)
    })()
  }

  const getVariantInfoByList = async () => {
    const skus = products.map((product) => product.sku)
    const getVariantInfoBySku = isB2BUser
      ? getB2BVariantInfoBySkus
      : getBcVariantInfoBySkus

    const { variantSku: variantInfoList = [] }: CustomFieldItems =
      await getVariantInfoBySku({
        skus,
      })

    setVariantInfoList(variantInfoList)
  }

  const validateProductNumber = (
    variantInfoList: CustomFieldItems,
    skus: string[]
  ) => {
    let isValid = true

    skus.forEach((sku) => {
      const variantInfo: CustomFieldItems | null = (variantInfoList || []).find(
        (variant: CustomFieldItems) =>
          variant.variantSku.toUpperCase() === sku.toUpperCase()
      )
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
            optionSelections: (product.product_options || []).map((option) => ({
              optionId: option.product_option_id,
              optionValue: option.value,
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

      if (cartInfo.length > 0) {
        await addProductToCart(
          {
            lineItems: items,
          },
          cartInfo[0].id
        )
      } else {
        await createCart({
          lineItems: items,
        })
      }

      setOpen(false)
      snackbar.success('', {
        jsx: successTip({
          message: 'Products are added to cart',
          link: '/cart.php',
          linkText: 'VIEW CART',
          isOutLink: true,
        }),
        isClose: true,
      })
      b3TriggerCartNumber()
    } catch (err: any) {
      snackbar.error(err?.detail, {
        isClose: true,
      })
    } finally {
      setIsRequestLoading(false)
    }
  }

  const handleSaveClick = () => {
    if (checkedArr.length === 0) {
      snackbar.error('Please select at least one item')
    }

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
          product_options: productOptions,
        } = product

        return {
          productId: +productId,
          variantId,
          quantity: +editQuantity,
          optionList: productOptions.map((option) => {
            const { product_option_id: optionId, value: optionValue } = option

            return {
              optionId: `attribute[${optionId}]`,
              optionValue,
            }
          }),
        }
      })
      const params = items.filter((item) =>
        checkedArr.includes(+item.variantId)
      )

      const addToShoppingList = isB2BUser
        ? addProductToShoppingList
        : addProductToBcShoppingList

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
        isClose: true,
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
      setEditableProducts(
        products.map((item: OrderProductItem) => ({
          ...item,
          editQuantity: item.quantity,
        }))
      )

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
          // cursor: 'pointer',
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
          maxWidth="md"
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
            setCheckedArr={setCheckedArr}
            setReturnArr={setReturnArr}
            textAlign={isMobile ? 'left' : 'right'}
            type={type}
          />

          {type === 'return' && (
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
          )}
        </B3Dialog>
      </Box>
      {itemKey === 'order-summary' && (
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
      {itemKey === 'order-summary' && (
        <CreateShoppingList
          open={isOpenCreateShopping}
          onChange={handleCreateShoppingClick}
          onClose={handleCloseShoppingClick}
        />
      )}
    </>
  )
}
