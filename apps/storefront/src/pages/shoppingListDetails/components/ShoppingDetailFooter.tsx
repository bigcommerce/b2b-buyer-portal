import {
  Box,
  Typography,
  Button,
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
} from '@/shared/service/bc'
import {
  snackbar,
} from '@/utils'

import {
  getB2BVariantInfoBySkus,
} from '@/shared/service/b2b/graphql/product'

import {
  ProductsProps,
} from '../shared/config'

interface ShoppingDetailFooterProps {
  shoppingListInfo: any,
  role: string | number,
  checkedArr: any,
  currencyToken: string,
  selectedSubTotal: number,
  setLoading: (val: boolean) => void,
  setDeleteOpen: (val: boolean) => void,
  setValidateFailureProducts: (arr: ProductsProps[]) => void,
  setValidateSuccessProducts: (arr: ProductsProps[]) => void,
}

const ShoppingDetailFooter = (props: ShoppingDetailFooterProps) => {
  const [isMobile] = useMobile()

  const containerStyle = isMobile ? {
    alignItems: 'flex-start',
    flexDirection: 'column',
  } : {
    alignItems: 'center',
  }

  const {
    shoppingListInfo,
    role,
    checkedArr,
    currencyToken,
    selectedSubTotal,
    setLoading,
    setDeleteOpen,
    setValidateFailureProducts,
    setValidateSuccessProducts,
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

      checkedArr.forEach((item: ProductsProps) => {
        const {
          node,
        } = item

        skus.push(node.variantSku)
      })

      const getInventoryInfos = await getB2BVariantInfoBySkus({
        skus,
      })

      const {
        validateFailureArr,
        validateSuccessArr,
      } = verifyInventory(getInventoryInfos?.variantSku || [])

      if (validateSuccessArr.length !== 0) {
        const lineItems = validateSuccessArr.map((item: ProductsProps) => {
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
        const res = cartInfo.length ? await addProductToCart({
          lineItems,
        }, cartInfo[0].id) : await createCart({
          lineItems,
        })
        if (res.status === 422) {
          snackbar.error(res.detail)
        } else {
          snackbar.success(`${validateSuccessArr.length} products were added to cart`)
        }
      }
      setValidateFailureProducts(validateFailureArr)
      setValidateSuccessProducts(validateSuccessArr)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        backgroundColor: '#fff',
        width: '100%',
        padding: '1rem',
        height: isMobile ? '8rem' : 'auto',
        display: 'flex',
        zIndex: '10',
        ...containerStyle,
      }}
    >
      <Typography
        sx={{
          marginLeft: isMobile ? '0' : '23%',
          marginRight: '7%',
        }}
      >
        {`${checkedArr.length} products  selected`}
      </Typography>
      <Typography
        variant="h6"
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
        {
          (role !== 2 || shoppingListInfo?.status === 0) && (
            <Button
              variant="contained"
              onClick={() => {
                handleAddProductsToCart()
              }}
              sx={{
                marginLeft: '0.5rem',
                width: isMobile ? '80%' : 'auto',
              }}
            >
              Add selected to cart
            </Button>
          )
        }
      </Box>
    </Box>

  )
}

export default ShoppingDetailFooter
