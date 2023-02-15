import {
  Box,
  Divider,
  Typography,
  Button,
  Card,
  CardContent,
} from '@mui/material'

import UploadFileIcon from '@mui/icons-material/UploadFile'

import {
  QuickAdd,
} from './QuickAdd'

import {
  createCart,
  getCartInfo,
  addProductToCart,
} from '@/shared/service/bc'

import {
  snackbar,
} from '@/utils'

import {
  B3LinkTipContent,
} from '@/components'

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

export const QuickOrderPad = () => {
  const handleSplitOptionId = (id: string | number) => {
    if (typeof id === 'string' && id.includes('attribute')) {
      const idRight = id.split('[')[1]

      const optionId = idRight.split(']')[0]
      return +optionId
    }

    if (typeof id === 'number') {
      return id
    }
  }

  const quickAddToList = async (products: CustomFieldItems[]) => {
    const lineItems = products.map((product) => {
      const {
        newSelectOptionList,
        quantity,
      } = product
      const optionList = newSelectOptionList.map((option: any) => {
        const splitOptionId = handleSplitOptionId(option.optionId)

        return ({
          optionId: splitOptionId,
          optionValue: option.optionValue,
        })
      })

      return ({
        optionList,
        productId: parseInt(product.productId, 10) || 0,
        quantity,
        variantId: parseInt(product.variantId, 10) || 0,
      })
    })

    const cartInfo = await getCartInfo()
    const res = cartInfo.length ? await addProductToCart({
      lineItems,
    }, cartInfo[0].id) : await createCart({
      lineItems,
    })

    if (res.status) {
      snackbar.error(res.detail)
    } else if (!res.status) {
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

    return res
  }

  return (
    <Card sx={{
      marginBottom: '50px',
    }}
    >
      <CardContent>
        <Box>
          <Typography
            variant="h5"
            sx={{
              marginBottom: '1rem',
            }}
          >
            Quick order pad
          </Typography>

          <Divider />

          <QuickAdd
            quickAddToList={quickAddToList}
            buttonText="Add products to cart"
          />

          <Divider />

          <Box sx={{
            margin: '20px 0 0',
          }}
          >
            <Button variant="text">
              <UploadFileIcon sx={{
                marginRight: '8px',
              }}
              />
              Bulk upload CSV
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}
