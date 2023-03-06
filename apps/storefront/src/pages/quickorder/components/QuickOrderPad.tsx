import {
  useEffect,
  useState,
} from 'react'

import {
  Box,
  Divider,
  Typography,
  Button,
  Card,
  CardContent,
  Link,
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
  B3Upload,
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
  const [isOpenBulkLoadCSV, setIsOpenBulkLoadCSV] = useState(false)
  const [productData, setProductData] = useState<CustomFieldItems>([])
  const [addBtnText, setAddBtnText] = useState<string>('Add to cart')
  const [isLoading, setIsLoading] = useState(false)

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

  const limitProductTips = (data: CustomFieldItems) => (
    <>
      <p style={{
        margin: 0,
      }}
      >
        {`SKU ${data.variantSku} is not enough stock`}
      </p>
      <p style={{
        margin: 0,
      }}
      >
        {`Available amount - ${data.AvailableAmount}.`}
      </p>
    </>
  )

  const outOfStockProductTips = (outOfStock: CustomFieldItems, fileErrorsCSV: string) => (
    <>
      <p style={{
        margin: 0,
      }}
      >
        {`SKU ${outOfStock} are out of stock.`}
      </p>
      <Link
        href={fileErrorsCSV}
        sx={{
          color: '#FFFFFF',
        }}
      >
        Download errors csv
      </Link>
    </>
  )

  const handleAddToCart = async (validProduct: CustomFieldItems) => {
    setIsLoading(true)
    try {
      const {
        notPurchaseSku,
        productItems,
        limitProduct,
        minLimitQuantity,
        maxLimitQuantity,
        outOfStock,
        stockErrorFile,
      } = validProduct

      if (productItems.length > 0) {
        const cartInfo = await getCartInfo()
        const res = cartInfo.length ? await addProductToCart({
          lineItems: productItems,
        }, cartInfo[0].id) : await createCart({
          lineItems: productItems,
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
      }

      if (limitProduct.length > 0) {
        limitProduct.forEach((data: CustomFieldItems) => {
          snackbar.warning('', {
            jsx: () => limitProductTips(data),
          })
        })
      }

      if (notPurchaseSku.length > 0) {
        snackbar.error(`SKU ${notPurchaseSku} cannot be purchased in online store.`)
      }

      if (outOfStock.length > 0 && stockErrorFile) {
        snackbar.error('', {
          jsx: () => outOfStockProductTips(outOfStock, stockErrorFile),
        })
      }

      if (minLimitQuantity.length > 0) {
        minLimitQuantity.forEach((data: CustomFieldItems) => {
          snackbar.error(`You need to purchase a minimum of ${data.minQuantity} of the ${data.variantSku} per order.`)
        })
      }

      if (maxLimitQuantity.length > 0) {
        maxLimitQuantity.forEach((data: CustomFieldItems) => {
          snackbar.error(`You need to purchase a minimum of ${data.maxQuantity} of the ${data.variantSku} per order.`)
        })
      }

      setIsOpenBulkLoadCSV(false)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (productData?.length > 0) {
      setAddBtnText(`Add ${productData.length} products to cart`)
    }
  }, [productData])

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
            <Button
              variant="text"
              onClick={() => {
                setIsOpenBulkLoadCSV(true)
              }}
            >
              <UploadFileIcon sx={{
                marginRight: '8px',
              }}
              />
              Bulk upload CSV
            </Button>
          </Box>
        </Box>
      </CardContent>

      <B3Upload
        isOpen={isOpenBulkLoadCSV}
        setIsOpen={setIsOpenBulkLoadCSV}
        handleAddToList={handleAddToCart}
        setProductData={setProductData}
        addBtnText={addBtnText}
        isLoading={isLoading}
      />
    </Card>
  )
}
