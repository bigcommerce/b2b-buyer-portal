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

interface ShoppingDetailFooterProps {
  shoppingListInfo: any,
  role: string | number,
  checkedArr: any,
  currencyToken: string,
  selectedSubTotal: number,
  // handleDeleteItems: () => void,
  setLoading: (val: boolean) => void,
  setDeleteOpen: (val: boolean) => void,
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
    // handleDeleteItems,
    setLoading,
    setDeleteOpen,
  } = props

  const handleAddProductsToCart = async () => {
    setLoading(true)
    try {
      const lineItems = checkedArr.map((item: CustomFieldItems) => {
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
      console.log(res)
      if (res.status === 422) {
        snackbar.error(res.detail)
      } else {
        snackbar.success(`${checkedArr.length} products were added to cart`)
      }
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
        {`Subtotal: ${currencyToken}${selectedSubTotal}`}
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
