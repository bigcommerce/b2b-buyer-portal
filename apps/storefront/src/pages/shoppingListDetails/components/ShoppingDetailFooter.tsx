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

interface ShoppingDetailFooterProps {
  shoppingListInfo: any,
  role: string | number,
  checkedArr: any,
  currencyToken: string,
  selectedSubTotal: number | string,
  handleDeleteItems: () => void,
  setLoading: (val: boolean) => void
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
    handleDeleteItems,
    setLoading,
  } = props

  const handleAddProductsToCart = async () => {
    setLoading(true)
    try {
      console.log(checkedArr, 'checkedArr')

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
      if (cartInfo.length > 0) {
        await addProductToCart({
          lineItems,
        }, cartInfo[0].id)
      } else {
        await createCart({
          lineItems,
        })
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
              handleDeleteItems()
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
