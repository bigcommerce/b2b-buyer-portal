import {
  useContext,
} from 'react'

import {
  Box,
  Typography,
  Button,
  Grid,
} from '@mui/material'

import {
  Delete,
} from '@mui/icons-material'

import {
  useMobile,
} from '@/hooks'

import {
  createCart,
  getCartInfo,
  addProductToCart,
  deleteCart,
} from '@/shared/service/bc'
import {
  snackbar,
} from '@/utils'

import {
  getB2BVariantInfoBySkus,
  getBcVariantInfoBySkus,
} from '@/shared/service/b2b/graphql/product'

import {
  ProductsProps,
  addlineItems,
} from '../shared/config'
import {
  B3LinkTipContent,
  CustomButton,
} from '@/components'

import {
  GlobaledContext,
} from '@/shared/global'

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

interface ShoppingDetailFooterProps {
  shoppingListInfo: any,
  role: string | number,
  allowJuniorPlaceOrder: boolean,
  checkedArr: any,
  currencyToken: string,
  selectedSubTotal: number,
  setLoading: (val: boolean) => void,
  setDeleteOpen: (val: boolean) => void,
  setValidateFailureProducts: (arr: ProductsProps[]) => void,
  setValidateSuccessProducts: (arr: ProductsProps[]) => void,
  isB2BUser: boolean,
}

const ShoppingDetailFooter = (props: ShoppingDetailFooterProps) => {
  const [isMobile] = useMobile()

  const {
    state: {
      isAgenting,
    },
  } = useContext(GlobaledContext)

  const containerStyle = isMobile ? {
    alignItems: 'flex-start',
    flexDirection: 'column',
  } : {
    alignItems: 'center',
  }

  const {
    shoppingListInfo,
    role,
    allowJuniorPlaceOrder,
    checkedArr,
    currencyToken,
    selectedSubTotal,
    setLoading,
    setDeleteOpen,
    setValidateFailureProducts,
    setValidateSuccessProducts,
    isB2BUser,
  } = props

  const verifyInventory = (inventoryInfos: ProductsProps[]) => {
    const validateFailureArr: ProductsProps[] = []
    const validateSuccessArr: ProductsProps[] = []

    checkedArr.forEach((item: ProductsProps) => {
      const {
        node,
      } = item

      inventoryInfos.forEach((option: CustomFieldItems) => {
        if (node.variantSku === option.variantSku) {
          let isPassVerify = true
          if (option.isStock === '1' && +node.quantity > option.stock) isPassVerify = false

          if (option.minQuantity !== 0 && +node.quantity < option.minQuantity) isPassVerify = false

          if (option.maxQuantity !== 0 && +node.quantity > option.maxQuantity) isPassVerify = false

          if (isPassVerify) {
            validateSuccessArr.push({
              node,
            })
          } else {
            validateFailureArr.push({
              node: {
                ...node,
              },
              stock: option.stock,
              isStock: option.isStock,
              maxQuantity: option.maxQuantity,
              minQuantity: option.minQuantity,
            })
          }
        }
      })
    })

    return {
      validateFailureArr,
      validateSuccessArr,
    }
  }

  const handleAddProductsToCart = async () => {
    setLoading(true)
    try {
      const skus: string[] = []

      let cantPurchase: string = ''

      checkedArr.forEach((item: ProductsProps) => {
        const {
          node,
        } = item

        if (node.productsSearch.availability === 'disabled') {
          cantPurchase += `${node.variantSku},`
        }

        skus.push(node.variantSku)
      })

      if (cantPurchase) {
        snackbar.error(`Sku(s): ${cantPurchase.slice(0, -1)} unavailable for purchasing, please uncheck.`)
        return
      }

      if (skus.length === 0) {
        snackbar.error(allowJuniorPlaceOrder ? 'Please select at least one item to checkout' : 'Please select at least one item to add to cart')
        return
      }

      const getVariantInfoBySku = isB2BUser ? getB2BVariantInfoBySkus : getBcVariantInfoBySkus

      const getInventoryInfos = await getVariantInfoBySku({
        skus,
      })

      const {
        validateFailureArr,
        validateSuccessArr,
      } = verifyInventory(getInventoryInfos?.variantSku || [])

      if (validateSuccessArr.length !== 0) {
        const lineItems = addlineItems(validateSuccessArr)
        const cartInfo = await getCartInfo()
        let res = null
        if (allowJuniorPlaceOrder && cartInfo.length) {
          await deleteCart(cartInfo[0].id)
          res = await createCart({
            lineItems,
          })
        } else {
          res = cartInfo.length ? await addProductToCart({
            lineItems,
          }, cartInfo[0].id) : await createCart({
            lineItems,
          })
        }
        if (res.status === 422) {
          snackbar.error(res.detail)
        } else if (validateFailureArr.length === 0) {
          if (allowJuniorPlaceOrder && +role === 2 && shoppingListInfo?.status === 0) {
            window.location.href = '/checkout'
          } else {
            snackbar.success('', {
              jsx: successTip({
                message: 'Products were added to cart',
                link: '/cart.php',
                linkText: 'VIEW CART',
                isOutLink: true,
              }),
              isClose: true,
            })
          }
        }
      }
      setValidateFailureProducts(validateFailureArr)
      setValidateSuccessProducts(validateSuccessArr)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Grid
      sx={{
        position: 'fixed',
        bottom: isMobile && isAgenting ? '52px' : 0,
        left: 0,
        backgroundColor: '#fff',
        width: '100%',
        padding: isMobile ? '0 0 1rem 0' : '0 40px 1rem 40px',
        height: isMobile ? '8rem' : 'auto',
        marginLeft: 0,
        display: 'flex',
        flexWrap: 'nowrap',
        zIndex: '999',
      }}
      container
      spacing={2}
    >
      <Grid
        item
        sx={{
          display: isMobile ? 'none' : 'block',
          width: '290px',
          paddingLeft: '20px',
        }}
      />
      <Grid
        item
        sx={isMobile ? {
          flexBasis: '100%',
        } : {
          flexBasis: '690px',
          flexGrow: 1,
        }}
      >
        <Box
          sx={{
            width: '100%',
            pr: '20px',
            display: 'flex',
            zIndex: '999',
            justifyContent: 'space-between',
            ...containerStyle,
          }}
        >
          <Typography
            sx={{
              color: '#000000',
              fontSize: '16px',
              fontWeight: '400',
            }}
          >
            {`${checkedArr.length} products  selected`}
          </Typography>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: isMobile ? 'wrap' : 'nowrap',
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontSize: '16px',
                fontWeight: '700',
                color: '#000000',
              }}
            >
              {`Subtotal: ${currencyToken}${selectedSubTotal.toFixed(2)}`}
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                marginTop: isMobile ? '0.5rem' : 0,
                width: isMobile ? '100%' : 'auto',
              }}
            >
              {
                (!allowJuniorPlaceOrder) && (
                  <Button
                    sx={{
                      padding: '5px',
                      border: '1px solid #1976d2',
                      margin: isMobile ? '0 1rem 0 0' : '0 1rem',
                      minWidth: 'auto',
                    }}
                    disabled={shoppingListInfo?.status === 40}
                  >
                    <Delete
                      color="primary"
                      onClick={() => {
                        setDeleteOpen(true)
                      }}
                    />
                  </Button>
                )
              }
              {
                (allowJuniorPlaceOrder || (role !== 2 && shoppingListInfo?.status === 0) || !isB2BUser) && (
                  <CustomButton
                    variant="contained"
                    onClick={() => {
                      handleAddProductsToCart()
                    }}
                    sx={{
                      marginLeft: '0.5rem',
                      width: isMobile ? '80%' : 'auto',
                    }}
                  >
                    {allowJuniorPlaceOrder ? 'Proceed to checkout' : 'Add selected to cart'}
                  </CustomButton>
                )
              }
            </Box>
          </Box>
        </Box>
      </Grid>
      <Grid
        item
        sx={isMobile ? {
          flexBasis: '100%',
          display: isMobile ? 'none' : 'block',
        } : {
          flexBasis: '340px',
          display: isMobile ? 'none' : 'block',
        }}
      />
    </Grid>
  )
}

export default ShoppingDetailFooter
