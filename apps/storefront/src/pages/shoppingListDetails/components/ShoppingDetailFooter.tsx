import { useContext } from 'react'
import { useB3Lang } from '@b3/lang'
import { Delete } from '@mui/icons-material'
import { Box, Grid, Typography } from '@mui/material'

import { CustomButton, successTip } from '@/components'
import { useMobile } from '@/hooks'
import { GlobaledContext } from '@/shared/global'
import {
  getB2BVariantInfoBySkus,
  getBcVariantInfoBySkus,
} from '@/shared/service/b2b/graphql/product'
import {
  addProductToCart,
  createCart,
  deleteCart,
  getCartInfo,
} from '@/shared/service/bc'
import { currencyFormat, snackbar } from '@/utils'
import { addlineItems, ProductsProps } from '@/utils/b3Product/shared/config'

interface ShoppingDetailFooterProps {
  shoppingListInfo: any
  role: string | number
  allowJuniorPlaceOrder: boolean
  checkedArr: any
  selectedSubTotal: number
  setLoading: (val: boolean) => void
  setDeleteOpen: (val: boolean) => void
  setValidateFailureProducts: (arr: ProductsProps[]) => void
  setValidateSuccessProducts: (arr: ProductsProps[]) => void
  isB2BUser: boolean
  customColor: string
}

function ShoppingDetailFooter(props: ShoppingDetailFooterProps) {
  const [isMobile] = useMobile()
  const b3Lang = useB3Lang()

  const {
    state: { isAgenting },
  } = useContext(GlobaledContext)

  const containerStyle = isMobile
    ? {
        alignItems: 'flex-start',
        flexDirection: 'column',
      }
    : {
        alignItems: 'center',
      }

  const {
    shoppingListInfo,
    role,
    allowJuniorPlaceOrder,
    checkedArr,
    selectedSubTotal,
    setLoading,
    setDeleteOpen,
    setValidateFailureProducts,
    setValidateSuccessProducts,
    isB2BUser,
    customColor,
  } = props

  const verifyInventory = (inventoryInfos: ProductsProps[]) => {
    const validateFailureArr: ProductsProps[] = []
    const validateSuccessArr: ProductsProps[] = []

    checkedArr.forEach((item: ProductsProps) => {
      const { node } = item

      const inventoryInfo: CustomFieldItems =
        inventoryInfos.find(
          (option: CustomFieldItems) => option.variantSku === node.variantSku
        ) || {}

      if (inventoryInfo) {
        let isPassVerify = true
        if (
          inventoryInfo.isStock === '1' &&
          (node?.quantity ? +node.quantity : 0) > inventoryInfo.stock
        )
          isPassVerify = false

        if (
          inventoryInfo.minQuantity !== 0 &&
          (node?.quantity ? +node.quantity : 0) < inventoryInfo.minQuantity
        )
          isPassVerify = false

        if (
          inventoryInfo.maxQuantity !== 0 &&
          (node?.quantity ? +node.quantity : 0) > inventoryInfo.maxQuantity
        )
          isPassVerify = false

        if (isPassVerify) {
          validateSuccessArr.push({
            node,
          })
        } else {
          validateFailureArr.push({
            node: {
              ...node,
            },
            stock: inventoryInfo.stock,
            isStock: inventoryInfo.isStock,
            maxQuantity: inventoryInfo.maxQuantity,
            minQuantity: inventoryInfo.minQuantity,
          })
        }
      }
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

      let cantPurchase = ''

      checkedArr.forEach((item: ProductsProps) => {
        const { node } = item

        if (node.productsSearch.availability === 'disabled') {
          cantPurchase += `${node.variantSku},`
        }

        skus.push(node.variantSku)
      })

      if (cantPurchase) {
        snackbar.error(
          b3Lang('shoppingList.footer.unavailableProducts', {
            skus: cantPurchase.slice(0, -1),
          }),
          {
            isClose: true,
          }
        )
        return
      }

      if (skus.length === 0) {
        snackbar.error(
          allowJuniorPlaceOrder
            ? b3Lang('shoppingList.footer.selectItemsToCheckout')
            : b3Lang('shoppingList.footer.selectItemsToAddToCart'),
          {
            isClose: true,
          }
        )
        return
      }

      const getVariantInfoBySku = isB2BUser
        ? getB2BVariantInfoBySkus
        : getBcVariantInfoBySkus

      const getInventoryInfos = await getVariantInfoBySku({
        skus,
      })

      const { validateFailureArr, validateSuccessArr } = verifyInventory(
        getInventoryInfos?.variantSku || []
      )

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
          res = cartInfo.length
            ? await addProductToCart(
                {
                  lineItems,
                },
                cartInfo[0].id
              )
            : await createCart({
                lineItems,
              })
        }
        if (res.status === 422) {
          snackbar.error(res.detail, {
            isClose: true,
          })
        } else if (validateFailureArr.length === 0) {
          if (
            allowJuniorPlaceOrder &&
            +role === 2 &&
            shoppingListInfo?.status === 0
          ) {
            window.location.href = '/checkout'
          } else {
            snackbar.success('', {
              jsx: successTip({
                message: b3Lang('shoppingList.footer.productsAddedToCart'),
                link: '/cart.php',
                linkText: b3Lang('shoppingList.footer.viewCart'),
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
        sx={
          isMobile
            ? {
                flexBasis: '100%',
              }
            : {
                flexBasis: '690px',
                flexGrow: 1,
              }
        }
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
            {b3Lang('shoppingList.footer.selectedProducts', {
              quantity: checkedArr.length,
            })}
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
              {b3Lang('shoppingList.footer.subtotal', {
                subtotal: currencyFormat(selectedSubTotal),
              })}
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                marginTop: isMobile ? '0.5rem' : 0,
                width: isMobile ? '100%' : 'auto',
              }}
            >
              {!allowJuniorPlaceOrder && (
                <CustomButton
                  sx={{
                    padding: '5px',
                    border: `1px solid ${customColor || '#1976d2'}`,
                    margin: isMobile ? '0 1rem 0 0' : '0 1rem',
                    minWidth: 'auto',
                  }}
                  disabled={shoppingListInfo?.status === 40}
                >
                  <Delete
                    color="primary"
                    sx={{
                      color: customColor,
                    }}
                    onClick={() => {
                      setDeleteOpen(true)
                    }}
                  />
                </CustomButton>
              )}
              {(allowJuniorPlaceOrder ||
                (role !== 2 && shoppingListInfo?.status === 0) ||
                !isB2BUser) && (
                <CustomButton
                  variant="contained"
                  onClick={() => {
                    handleAddProductsToCart()
                  }}
                  sx={{
                    marginLeft: '0.5rem',
                    marginRight: '0.25rem',
                    width: isMobile ? '80%' : '210px',
                    height: isMobile ? '80%' : '40px',
                    padding: '8px 22px',
                  }}
                >
                  {allowJuniorPlaceOrder
                    ? b3Lang('shoppingList.footer.proceedToCheckout')
                    : b3Lang('shoppingList.footer.addToCart')}
                </CustomButton>
              )}
            </Box>
          </Box>
        </Box>
      </Grid>
      <Grid
        item
        sx={
          isMobile
            ? {
                flexBasis: '100%',
                display: isMobile ? 'none' : 'block',
              }
            : {
                flexBasis: '340px',
                display: isMobile ? 'none' : 'block',
              }
        }
      />
    </Grid>
  )
}

export default ShoppingDetailFooter
