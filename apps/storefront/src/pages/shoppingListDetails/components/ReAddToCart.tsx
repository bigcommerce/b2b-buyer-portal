import { useEffect, useState } from 'react'
import { useB3Lang } from '@b3/lang'
import styled from '@emotion/styled'
import { Delete } from '@mui/icons-material'
import { Alert, Box, Grid, Typography } from '@mui/material'

import {
  B3Dialog,
  B3QuantityTextField,
  B3Sping,
  CustomButton,
  successTip,
} from '@/components'
import { PRODUCT_DEFAULT_IMAGE } from '@/constants'
import { useMobile } from '@/hooks'
import { addProductToCart, createCart, getCartInfo } from '@/shared/service/bc'
import { currencyFormat, setModifierQtyPrice, snackbar } from '@/utils'
import {
  addlineItems,
  getProductOptionsFields,
  ProductsProps,
} from '@/utils/b3Product/shared/config'

interface ShoppingProductsProps {
  shoppingListInfo: any
  role: string | number
  products: ProductsProps[]
  successProducts: number
  allowJuniorPlaceOrder: boolean
  getProductQuantity?: (item: ProductsProps) => number
  onProductChange?: (products: ProductsProps[]) => void
  setValidateFailureProducts: (arr: ProductsProps[]) => void
  setValidateSuccessProducts: (arr: ProductsProps[]) => void
  textAlign?: string
}

interface FlexProps {
  isHeader?: boolean
  isMobile?: boolean
}

interface FlexItemProps {
  width?: string
  padding?: string
  flexBasis?: string
  alignItems?: string
  flexDirection?:
    | 'column'
    | 'inherit'
    | '-moz-initial'
    | 'initial'
    | 'revert'
    | 'unset'
    | 'column-reverse'
    | 'row'
    | 'row-reverse'
  textAlignLocation?: string
}

const Flex = styled('div')(({ isHeader, isMobile }: FlexProps) => {
  const headerStyle = isHeader
    ? {
        borderBottom: '1px solid #D9DCE9',
        paddingBottom: '8px',
        alignItems: 'center',
      }
    : {
        alignItems: 'flex-start',
      }

  const mobileStyle = isMobile
    ? {
        borderTop: '1px solid #D9DCE9',
        padding: '12px 0 12px',
        '&:first-of-type': {
          marginTop: '12px',
        },
      }
    : {}

  const flexWrap = isMobile ? 'wrap' : 'initial'

  return {
    display: 'flex',
    wordBreak: 'break-word',
    padding: '8px 0 0',
    gap: '8px',
    flexWrap,
    ...headerStyle,
    ...mobileStyle,
  }
})

const FlexItem = styled(Box)(
  ({
    width,
    padding = '0',
    flexBasis,
    flexDirection = 'row',
    alignItems,
    textAlignLocation,
  }: FlexItemProps) => ({
    display: 'flex',
    justifyContent: textAlignLocation === 'right' ? 'flex-end' : 'flex-start',
    flexDirection,
    flexGrow: width ? 0 : 1,
    flexShrink: width ? 0 : 1,
    alignItems: alignItems || 'flex-start',
    flexBasis,
    width,
    padding,
  })
)

const ProductHead = styled('div')(() => ({
  fontSize: '0.875rem',
  lineHeight: '1.5',
  color: '#263238',
}))

const ProductImage = styled('img')(() => ({
  width: '60px',
  borderRadius: '4px',
  flexShrink: 0,
}))

const defaultItemStyle = {
  default: {
    width: '15%',
  },
  qty: {
    width: '80px',
  },
  delete: {
    width: '30px',
  },
}

const mobileItemStyle = {
  default: {
    width: '100%',
    padding: '0 0 0 76px',
  },
  qty: {
    width: '100%',
    padding: '0 0 0 76px',
  },
  delete: {
    width: '100%',
    padding: '0 0 0 76px',
    display: 'flex',
    flexDirection: 'row-reverse',
  },
}

export default function ReAddToCart(props: ShoppingProductsProps) {
  const {
    shoppingListInfo,
    role,
    products,
    successProducts,
    allowJuniorPlaceOrder,
    setValidateFailureProducts,
    setValidateSuccessProducts,
    textAlign = 'left',
  } = props

  const b3Lang = useB3Lang()

  const [isOpen, setOpen] = useState<boolean>(false)

  const [loading, setLoading] = useState<boolean>(false)

  const [isMobile] = useMobile()

  useEffect(() => {
    if (products.length > 0) {
      setOpen(true)
    } else {
      setOpen(false)
    }
  }, [products])

  const itemStyle = isMobile ? mobileItemStyle : defaultItemStyle

  const handleUpdateProductQty = async (
    index: number,
    value: number | string,
    isValid: boolean
  ) => {
    const newProduct: ProductsProps[] = [...products]
    newProduct[index].node.quantity = +value
    newProduct[index].isValid = isValid
    const caculateProduct = await setModifierQtyPrice(
      newProduct[index].node,
      +value
    )
    if (caculateProduct) {
      ;(newProduct[index] as CustomFieldItems).node = caculateProduct
      setValidateFailureProducts(newProduct)
    }
  }

  const handleCancelClicked = () => {
    setOpen(false)
    setValidateFailureProducts([])
    setValidateSuccessProducts([])
  }

  const deleteProduct = (index: number) => {
    const newProduct: ProductsProps[] = [...products]
    newProduct.splice(index, 1)
    setValidateFailureProducts(newProduct)
  }

  const handRightClick = async () => {
    const isValidate = products.every((item: ProductsProps) => item.isValid)

    if (!isValidate) {
      snackbar.error(
        b3Lang('shoppingListDetails.reAddToCart.fillCorrectQuantity')
      )
      return
    }
    try {
      setLoading(true)

      const lineItems = addlineItems(products)
      const cartInfo = await getCartInfo()
      let res
      if (cartInfo.length > 0) {
        res = await addProductToCart(
          {
            lineItems,
          },
          cartInfo[0].id
        )
      } else {
        res = await createCart({
          lineItems,
        })
      }
      if (res.status === 422) {
        snackbar.error(res.detail, {
          isClose: true,
        })
      } else {
        handleCancelClicked()
        if (
          allowJuniorPlaceOrder &&
          +role === 2 &&
          shoppingListInfo?.status === 0
        ) {
          window.location.href = '/checkout'
        } else {
          snackbar.success('', {
            jsx: successTip({
              message: b3Lang('shoppingListDetails.reAddToCart.productsAdded'),
              link: '/cart.php',
              linkText: b3Lang('shoppingListDetails.reAddToCart.viewCart'),
              isOutLink: true,
            }),
            isClose: true,
          })
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const handleClearNoStock = async () => {
    const newProduct = products.filter(
      (item: ProductsProps) => item.isStock === '0' || item.stock !== 0
    )
    const requestArr: Promise<any>[] = []
    newProduct.forEach((product) => {
      const {
        node: { quantity },
        minQuantity = 0,
        maxQuantity = 0,
        isStock,
        stock,
      } = product

      const quantityNumber = parseInt(`${quantity}`, 10) || 0
      if (minQuantity !== 0 && quantityNumber < minQuantity) {
        product.node.quantity = minQuantity
      } else if (maxQuantity !== 0 && quantityNumber > maxQuantity) {
        product.node.quantity = maxQuantity
      }
      if (isStock !== '0' && stock && (quantity ? +quantity : 0) > stock) {
        product.node.quantity = stock
      }

      product.isValid = true

      const qty = product?.node?.quantity ? +product.node.quantity : 0

      requestArr.push(setModifierQtyPrice(product.node, qty))
    })

    const productArr = await Promise.all(requestArr)

    productArr.forEach((item, index) => {
      newProduct[index].node = item
    })
    setValidateFailureProducts(newProduct)
  }

  return (
    <B3Dialog
      isOpen={isOpen}
      handleLeftClick={handleCancelClicked}
      handRightClick={handRightClick}
      title={
        allowJuniorPlaceOrder
          ? b3Lang('shoppingListDetails.reAddToCart.proceedToCheckout')
          : b3Lang('shoppingListDetails.reAddToCart.addToCart')
      }
      rightSizeBtn={
        allowJuniorPlaceOrder
          ? b3Lang('shoppingListDetails.reAddToCart.proceedToCheckout')
          : b3Lang('shoppingListDetails.reAddToCart.addToCart')
      }
      maxWidth="xl"
    >
      <Grid>
        <Box
          sx={{
            m: '0 0 1rem 0',
          }}
        >
          <Alert variant="filled" severity="success">
            {allowJuniorPlaceOrder
              ? b3Lang('shoppingListDetails.reAddToCart.productsCanCheckout', {
                  successProducts,
                })
              : b3Lang('shoppingListDetails.reAddToCart.productsAddedToCart', {
                  successProducts,
                })}
          </Alert>
        </Box>

        <Box
          sx={{
            m: '1rem 0',
          }}
        >
          <Alert variant="filled" severity="error">
            {allowJuniorPlaceOrder
              ? b3Lang('shoppingListDetails.reAddToCart.productsCantCheckout', {
                  quantity: products.length,
                })
              : b3Lang(
                  'shoppingListDetails.reAddToCart.productsNotAddedToCart',
                  { quantity: products.length }
                )}
          </Alert>
        </Box>
        <B3Sping isSpinning={loading} size={16} isFlex={false}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              margin: '0.5rem 0 1rem 0',
            }}
          >
            <Box
              sx={{
                fontSize: '24px',
              }}
            >
              {b3Lang('shoppingListDetails.reAddToCart.productCount', {
                quantity: products.length,
              })}
            </Box>
            <CustomButton onClick={() => handleClearNoStock()}>
              {b3Lang('shoppingListDetails.reAddToCart.adjustQuantity')}
            </CustomButton>
          </Box>

          {products.length > 0 ? (
            <Box>
              {!isMobile && (
                <Flex isHeader isMobile={isMobile}>
                  <FlexItem>
                    <ProductHead>
                      {b3Lang('shoppingListDetails.reAddToCart.product')}
                    </ProductHead>
                  </FlexItem>
                  <FlexItem
                    {...itemStyle.default}
                    textAlignLocation={textAlign}
                  >
                    <ProductHead>
                      {b3Lang('shoppingListDetails.reAddToCart.price')}
                    </ProductHead>
                  </FlexItem>
                  <FlexItem
                    sx={{
                      justifyContent: 'center',
                    }}
                    {...itemStyle.default}
                    textAlignLocation={textAlign}
                  >
                    <ProductHead>
                      {b3Lang('shoppingListDetails.reAddToCart.quantity')}
                    </ProductHead>
                  </FlexItem>
                  <FlexItem
                    {...itemStyle.default}
                    textAlignLocation={textAlign}
                  >
                    <ProductHead>
                      {b3Lang('shoppingListDetails.reAddToCart.total')}
                    </ProductHead>
                  </FlexItem>
                  <FlexItem {...itemStyle.delete}>
                    <ProductHead> </ProductHead>
                  </FlexItem>
                </Flex>
              )}
              {products.map((product: ProductsProps, index: number) => {
                const { isStock, maxQuantity, minQuantity, stock } = product

                const {
                  quantity = 1,
                  primaryImage,
                  productName,
                  variantSku,
                  optionList,
                  productsSearch,
                  basePrice,
                } = product.node

                const price = +basePrice
                const total = (price * (quantity ? +quantity : 0)).toFixed(2)

                const newProduct: any = {
                  ...productsSearch,
                  selectOptions: optionList,
                }

                const productFields = getProductOptionsFields(newProduct, {})

                const newOptionList = JSON.parse(optionList)
                const optionsValue: CustomFieldItems[] = productFields.filter(
                  (item) => item.valueText
                )

                return (
                  <Flex isMobile={isMobile} key={variantSku}>
                    <FlexItem>
                      <ProductImage
                        src={primaryImage || PRODUCT_DEFAULT_IMAGE}
                      />
                      <Box
                        sx={{
                          marginLeft: '16px',
                        }}
                      >
                        <Typography variant="body1" color="#212121">
                          {productName}
                        </Typography>
                        <Typography variant="body1" color="#616161">
                          {variantSku}
                        </Typography>
                        {newOptionList.length > 0 &&
                          optionsValue.length > 0 &&
                          optionsValue.map((option: CustomFieldItems) => (
                            <Typography
                              sx={{
                                fontSize: '0.75rem',
                                lineHeight: '1.5',
                                color: '#455A64',
                              }}
                              key={option.valueLabel}
                            >
                              {`${option.valueLabel}: ${option.valueText}`}
                            </Typography>
                          ))}
                      </Box>
                    </FlexItem>
                    <FlexItem
                      {...itemStyle.default}
                      textAlignLocation={textAlign}
                    >
                      {isMobile && <span>Price: </span>}
                      {`${currencyFormat(price)}`}
                    </FlexItem>
                    <FlexItem
                      {...itemStyle.default}
                      textAlignLocation={textAlign}
                    >
                      <B3QuantityTextField
                        isStock={isStock}
                        maxQuantity={maxQuantity}
                        minQuantity={minQuantity}
                        stock={stock}
                        value={quantity}
                        onChange={(value, isValid) => {
                          handleUpdateProductQty(index, value, isValid)
                        }}
                      />
                    </FlexItem>
                    <FlexItem
                      {...itemStyle.default}
                      textAlignLocation={textAlign}
                    >
                      {isMobile && <div>Total: </div>}
                      {`${currencyFormat(total)}`}
                    </FlexItem>

                    <FlexItem {...itemStyle.delete}>
                      <Delete
                        sx={{
                          cursor: 'pointer',
                          color: 'rgba(0, 0, 0, 0.54)',
                        }}
                        onClick={() => {
                          deleteProduct(index)
                        }}
                      />
                    </FlexItem>
                  </Flex>
                )
              })}
            </Box>
          ) : null}
        </B3Sping>
      </Grid>
    </B3Dialog>
  )
}
