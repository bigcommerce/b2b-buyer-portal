import {
  Box,
  Typography,
  TextField,
  Grid,
  Button,
  Alert,
} from '@mui/material'

import {
  useEffect,
  useState,
} from 'react'

import styled from '@emotion/styled'

import {
  Delete,
} from '@mui/icons-material'

import {
  snackbar,
} from '@/utils'
import {
  createCart,
  getCartInfo,
  addProductToCart,
} from '@/shared/service/bc'
import {
  useMobile,
} from '@/hooks'

import {
  B3Dialog,
  B3Sping,
} from '@/components'

import {
  ProductsProps,
} from '../shared/config'

interface ShoppingProductsProps {
  products: ProductsProps[],
  currencyToken: string,
  successProducts: number,
  getProductQuantity?: (item: ProductsProps) => number
  onProductChange?: (products: ProductsProps[]) => void
  setValidateFailureProducts: (arr: ProductsProps[]) => void,
  setValidateSuccessProducts: (arr: ProductsProps[]) => void,
}

interface FlexProps {
  isHeader?: boolean,
  isMobile?: boolean,
}

interface FlexItemProps {
  width?: string,
  padding?: string,
  flexBasis?: string,
}

const Flex = styled('div')(({
  isHeader,
  isMobile,
}: FlexProps) => {
  const headerStyle = isHeader ? {
    borderBottom: '1px solid #D9DCE9',
    paddingBottom: '8px',
    alignItems: 'center',
  } : {
    alignItems: 'flex-start',
  }

  const mobileStyle = isMobile ? {
    borderTop: '1px solid #D9DCE9',
    padding: '12px 0 12px',
    '&:first-of-type': {
      marginTop: '12px',
    },
  } : {}

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

const FlexItem = styled('div')(({
  width,
  padding = '0',
  flexBasis,
}: FlexItemProps) => ({
  display: 'flex',
  flexGrow: width ? 0 : 1,
  flexShrink: width ? 0 : 1,
  alignItems: 'flex-start',
  flexBasis,
  width,
  padding,
}))

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
    width: '80px',
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
  },
}

const defaultProductImage = 'https://cdn11.bigcommerce.com/s-1i6zpxpe3g/stencil/cd9e3830-4c73-0139-8a51-0242ac11000a/e/4fe76590-73f1-0139-3767-32e4ea84ca1d/img/ProductDefault.gif'

export const ReAddToCart = (props: ShoppingProductsProps) => {
  const {
    products,
    currencyToken,
    successProducts,
    setValidateFailureProducts,
    setValidateSuccessProducts,
  } = props

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

  const handleUpdateProductQty = (index: number, value: number | string) => {
    const newProduct: ProductsProps[] = [...products]
    newProduct[index].node.quantity = value
    setValidateFailureProducts(newProduct)
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

  const validateRule = (product: ProductsProps) => {
    const {
      maxQuantity = 0,
      minQuantity = 0,
      stock = 0,
      node,
      isStock = '0',
    } = product
    const {
      quantity,
    } = node

    if (isStock === '1' && quantity > stock) return `${stock} In Stock`

    if (minQuantity !== 0 && quantity < minQuantity) return `minQuantity is ${minQuantity}`

    if (maxQuantity !== 0 && quantity > maxQuantity) return `maxQuantity is ${maxQuantity}`

    return ''
  }

  const handRightClick = async () => {
    const isValidate = products.every((item: ProductsProps) => {
      if (validateRule(item)) return false
      return true
    })

    if (!isValidate) {
      snackbar.error('Please fill in the correct quantity')
      return
    }
    try {
      setLoading(true)
      const lineItems = products.map((item: ProductsProps) => {
        const {
          node,
        } = item

        const optionList = JSON.parse(node.optionList || '[]')

        const getOptionId = (id: number | string) => {
          if (typeof id === 'number') return id
          if (id.includes('attribute')) return +id.split('[')[1].split(']')[0]
          return +id
        }

        const optionValue = optionList.map((option: {
          option_id: number | string,
          option_value: number| string,
        }) => ({
          optionId: getOptionId(option.option_id),
          optionValue: option.option_value,
        }))

        return {
          quantity: node.quantity,
          productId: node.productId,
          optionSelections: optionValue,
        }
      })

      const cartInfo = await getCartInfo()
      let res
      if (cartInfo.length > 0) {
        res = await addProductToCart({
          lineItems,
        }, cartInfo[0].id)
      } else {
        res = await createCart({
          lineItems,
        })
      }
      if (res.status === 422) {
        snackbar.error(res.detail)
      } else {
        handleCancelClicked()
        snackbar.success(`${products.length} products were added to cart`)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleClearNoStock = () => {
    const newProduct = products.filter((item: ProductsProps) => item.stock !== 0)
    setValidateFailureProducts(newProduct)
  }

  return (
    <B3Dialog
      isOpen={isOpen}
      handleLeftClick={handleCancelClicked}
      handRightClick={handRightClick}
      title="Add to list"
      rightSizeBtn="Add to cart"
      maxWidth="xl"
    >
      <Grid>
        <Box
          sx={{
            m: '0 0 1rem 0',
          }}
        >
          <Alert severity="success">{`${successProducts} products were added to cart`}</Alert>
        </Box>

        <Box
          sx={{
            m: '1rem 0',
          }}
        >
          <Alert severity="error">{`${products.length} products were not added to cart, since they do not have enogh stock, please change quantity. `}</Alert>
        </Box>
        <B3Sping
          isSpinning={loading}
          size={16}
          isFlex={false}
        >
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
              {`${products.length} products`}
            </Box>
            <Button onClick={() => handleClearNoStock()}> Adjust quantity</Button>
          </Box>

          {
            products.length > 0 ? (
              <Box>
                {
                  !isMobile && (
                  <Flex
                    isHeader
                    isMobile={isMobile}
                  >
                    <FlexItem flexBasis="100px">
                      <ProductHead>Product</ProductHead>
                    </FlexItem>
                    <FlexItem {...itemStyle.default}>
                      <ProductHead>Price</ProductHead>
                    </FlexItem>
                    <FlexItem {...itemStyle.qty}>
                      <ProductHead>Qty</ProductHead>
                    </FlexItem>
                    <FlexItem {...itemStyle.default}>
                      <ProductHead>Total</ProductHead>
                    </FlexItem>
                    <FlexItem {...itemStyle.delete}>
                      <ProductHead> </ProductHead>
                    </FlexItem>
                  </Flex>
                  )
                }
                {
                  products.map((product: ProductsProps, index: number) => {
                    const {
                      basePrice,
                      quantity,
                      primaryImage,
                      productName,
                      variantSku,
                      optionList,
                      productsSearch: {
                        variants,
                      },
                      variantId,
                    } = product.node
                    const total = +basePrice * +quantity
                    const price = +basePrice

                    const newOptionList = JSON.parse(optionList)
                    let optionsValue = []
                    if (newOptionList.length > 0) {
                      const newVariant = variants.find((item:CustomFieldItems) => +item.variant_id
                      === +variantId || +item.id === +variantId)

                      optionsValue = newVariant?.option_values || []
                    }

                    return (
                      <Flex
                        isMobile={isMobile}
                        key={variantSku}
                      >
                        <FlexItem flexBasis="100px">
                          <ProductImage src={primaryImage || defaultProductImage} />
                          <Box
                            sx={{
                              marginLeft: '16px',
                            }}
                          >
                            <Typography
                              variant="body1"
                              color="#212121"
                            >
                              {productName}
                            </Typography>
                            <Typography
                              variant="body1"
                              color="#616161"
                            >
                              {variantSku}
                            </Typography>
                            {
                              newOptionList.length > 0 && optionsValue.length > 0 && optionsValue.map((option: CustomFieldItems) => (
                                <Typography
                                  variant="body1"
                                  color="#616161"
                                  key={option.option_display_name}
                                >
                                  {`${option.option_display_name
                                  }: ${option.label}`}
                                </Typography>
                              ))
                            }
                          </Box>
                        </FlexItem>
                        <FlexItem
                          {...itemStyle.default}
                        >
                          {isMobile && <span>Price: </span>}
                          {`${currencyToken}${price.toFixed(2)}`}
                        </FlexItem>
                        <FlexItem {...itemStyle.qty}>
                          <TextField
                            type="number"
                            hiddenLabel={!isMobile}
                            variant="filled"
                            label={isMobile ? 'Qty' : ''}
                            value={quantity}
                            inputProps={{
                              inputMode: 'numeric', pattern: '[0-9]*',
                            }}
                            onChange={(e) => {
                              handleUpdateProductQty(index, e.target.value)
                            }}
                            error={!!validateRule(product)}
                            helperText={validateRule(product)}
                            size="small"
                            sx={{
                              width: isMobile ? '60%' : '100%',
                              '& .MuiFormHelperText-root': {
                                marginLeft: '0',
                                marginRight: '0',
                              },
                            }}
                          />
                        </FlexItem>
                        <FlexItem
                          {...itemStyle.default}
                        >
                          {isMobile && <div>Total: </div>}
                          {`${currencyToken}${total.toFixed(2)}`}
                        </FlexItem>

                        <FlexItem
                          {...itemStyle.delete}
                        >
                          <Delete
                            sx={{
                              cursor: 'pointer',
                              color: 'rgba(0, 0, 0, 0.54)',
                            }}
                            onClick={() => { deleteProduct(index) }}
                          />
                        </FlexItem>
                      </Flex>
                    )
                  })
                }
              </Box>
            ) : <></>
          }

        </B3Sping>

      </Grid>

    </B3Dialog>
  )
}
