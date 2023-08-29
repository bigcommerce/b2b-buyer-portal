import { useEffect, useState } from 'react'
import { useB3Lang } from '@b3/lang'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import {
  Box,
  Card,
  CardContent,
  Divider,
  Link,
  Typography,
} from '@mui/material'

import { B3Upload, CustomButton, successTip } from '@/components'
import { useBlockPendingAccountViewPrice, useMobile } from '@/hooks'
import { addProductToCart, createCart, getCartInfo } from '@/shared/service/bc'
import { B3SStorage, snackbar } from '@/utils'

import SearchProduct from '../../shoppingListDetails/components/SearchProduct'

import QuickAdd from './QuickAdd'

interface QuickOrderPadProps {
  isB2BUser: boolean
}

export default function QuickOrderPad(props: QuickOrderPadProps) {
  const { isB2BUser } = props
  const [isMobile] = useMobile()
  const b3Lang = useB3Lang()

  const [isOpenBulkLoadCSV, setIsOpenBulkLoadCSV] = useState(false)
  const [productData, setProductData] = useState<CustomFieldItems>([])
  const [addBtnText, setAddBtnText] = useState<string>('Add to cart')
  const [isLoading, setIsLoading] = useState(false)

  const [blockPendingAccountViewPrice] = useBlockPendingAccountViewPrice()

  const handleSplitOptionId = (id: string | number) => {
    if (typeof id === 'string' && id.includes('attribute')) {
      const idRight = id.split('[')[1]

      const optionId = idRight.split(']')[0]
      return +optionId
    }

    if (typeof id === 'number') {
      return id
    }

    return undefined
  }

  const quickAddToList = async (products: CustomFieldItems[]) => {
    const lineItems = products.map((product) => {
      const { newSelectOptionList, quantity } = product
      const optionSelections = newSelectOptionList.map(
        (option: CustomFieldItems) => {
          const splitOptionId = handleSplitOptionId(option.optionId)

          return {
            optionId: splitOptionId,
            optionValue: option.optionValue,
          }
        }
      )

      return {
        optionSelections,
        productId: parseInt(product.productId || product.id, 10) || 0,
        quantity,
        variantId: parseInt(product.variantId, 10) || 0,
      }
    })

    const cartInfo = await getCartInfo()
    const res = cartInfo.length
      ? await addProductToCart(
          {
            lineItems,
          },
          cartInfo[0].id
        )
      : await createCart({
          lineItems,
        })

    if (res.status) {
      snackbar.error(res.detail, {
        isClose: true,
      })
    } else if (!res.status) {
      snackbar.success('', {
        jsx: successTip({
          message: b3Lang('purchasedProducts.quickOrderPad.productsAdded'),
          link: '/cart.php',
          linkText: b3Lang('purchasedProducts.quickOrderPad.viewCart'),
          isOutLink: true,
        }),
        isClose: true,
      })
    }

    return res
  }

  const limitProductTips = (data: CustomFieldItems) => (
    <>
      <p
        style={{
          margin: 0,
        }}
      >
        {b3Lang('purchasedProducts.quickOrderPad.notEnoughStock', {
          sku: data.variantSku,
        })}
      </p>
      <p
        style={{
          margin: 0,
        }}
      >
        {b3Lang('purchasedProducts.quickOrderPad.availableAmount', {
          availableAmount: data.AvailableAmount,
        })}
      </p>
    </>
  )

  const outOfStockProductTips = (
    outOfStock: string[],
    fileErrorsCSV: string
  ) => (
    <>
      <p
        style={{
          margin: 0,
        }}
      >
        {b3Lang('purchasedProducts.quickOrderPad.outOfStockSku', {
          sku: outOfStock,
        })}
      </p>
      <Link
        href={fileErrorsCSV}
        sx={{
          color: '#FFFFFF',
        }}
      >
        {b3Lang('purchasedProducts.quickOrderPad.downloadErrorsCSV')}
      </Link>
    </>
  )

  const getValidProducts = (products: CustomFieldItems) => {
    const notPurchaseSku: string[] = []
    const productItems: CustomFieldItems[] = []
    const limitProduct: CustomFieldItems[] = []
    const minLimitQuantity: CustomFieldItems[] = []
    const maxLimitQuantity: CustomFieldItems[] = []
    const outOfStock: string[] = []

    products.forEach((item: CustomFieldItems) => {
      const { products: currentProduct, qty } = item
      const {
        option,
        isStock,
        stock,
        purchasingDisabled,
        maxQuantity,
        minQuantity,
        variantSku,
        variantId,
        productId,
      } = currentProduct

      if (purchasingDisabled === '1') {
        notPurchaseSku.push(variantSku)
        return
      }

      if (isStock === '1' && stock === 0) {
        outOfStock.push(variantSku)
        return
      }

      if (isStock === '1' && stock > 0 && stock < +qty) {
        limitProduct.push({
          variantSku,
          AvailableAmount: stock,
        })
        return
      }

      if (+minQuantity > 0 && +qty < +minQuantity) {
        minLimitQuantity.push({
          variantSku,
          minQuantity,
        })

        return
      }

      if (+maxQuantity > 0 && +qty > +maxQuantity) {
        maxLimitQuantity.push({
          variantSku,
          maxQuantity,
        })

        return
      }

      const optionsList = option.map((item: CustomFieldItems) => ({
        optionId: item.option_id,
        optionValue: item.id,
      }))

      productItems.push({
        productId: parseInt(productId, 10) || 0,
        variantId: parseInt(variantId, 10) || 0,
        quantity: +qty,
        optionSelections: optionsList,
      })
    })

    return {
      notPurchaseSku,
      productItems,
      limitProduct,
      minLimitQuantity,
      maxLimitQuantity,
      outOfStock,
    }
  }

  const handleAddToCart = async (productsData: CustomFieldItems) => {
    setIsLoading(true)
    try {
      const { stockErrorFile, validProduct } = productsData

      const {
        notPurchaseSku,
        productItems,
        limitProduct,
        minLimitQuantity,
        maxLimitQuantity,
        outOfStock,
      } = getValidProducts(validProduct)

      if (productItems.length > 0) {
        const cartInfo = await getCartInfo()
        const res = cartInfo.length
          ? await addProductToCart(
              {
                lineItems: productItems,
              },
              cartInfo[0].id
            )
          : await createCart({
              lineItems: productItems,
            })
        if (res.status) {
          snackbar.error(res.detail, {
            isClose: true,
          })
        } else if (!res.status) {
          snackbar.success('', {
            jsx: successTip({
              message: b3Lang('purchasedProducts.quickOrderPad.productsAdded'),
              link: '/cart.php',
              linkText: b3Lang('purchasedProducts.quickOrderPad.viewCart'),
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
        snackbar.error(
          b3Lang('purchasedProducts.quickOrderPad.notPurchaseableSku', {
            notPurchaseSku,
          }),
          {
            isClose: true,
          }
        )
      }

      if (outOfStock.length > 0 && stockErrorFile) {
        snackbar.error('', {
          jsx: () => outOfStockProductTips(outOfStock, stockErrorFile),
          isClose: true,
        })
      }

      if (minLimitQuantity.length > 0) {
        minLimitQuantity.forEach((data: CustomFieldItems) => {
          snackbar.error(
            b3Lang('purchasedProducts.quickOrderPad.minQuantityMessage', {
              minQuantity: data.minQuantity,
              sku: data.variantSku,
            }),
            {
              isClose: true,
            }
          )
        })
      }

      if (maxLimitQuantity.length > 0) {
        maxLimitQuantity.forEach((data: CustomFieldItems) => {
          snackbar.error(
            b3Lang('purchasedProducts.quickOrderPad.maxQuantityMessage', {
              minQuantity: data.maxQuantity,
              sku: data.variantSku,
            }),
            {
              isClose: true,
            }
          )
        })
      }

      setIsOpenBulkLoadCSV(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyProduct = (products: CustomFieldItems) => {
    const {
      variantId,
      variants,
      inventoryLevel,
      inventoryTracking,
      orderQuantityMaximum,
      orderQuantityMinimum,
      quantity,
      sku,
    } = products
    const isStock = inventoryTracking !== 'none'
    let purchasingDisabled = false
    let stock = inventoryLevel
    let productSku = sku

    const currentVariant = variants.find(
      (variant: CustomFieldItems) => +variant.variant_id === +variantId
    )
    if (currentVariant) {
      purchasingDisabled = currentVariant.purchasing_disabled
      stock =
        inventoryTracking === 'variant' ? currentVariant.inventory_level : stock
      productSku = currentVariant.sku || sku
    }

    if (purchasingDisabled) {
      snackbar.error(
        b3Lang('purchasedProducts.quickOrderPad.notPurchaseableSku', {
          notPurchaseSku: productSku,
        })
      )

      return false
    }

    if (isStock && +quantity > +stock) {
      snackbar.error(
        b3Lang('purchasedProducts.quickOrderPad.insufficientStockSku', {
          sku: productSku,
        }),
        {
          isClose: true,
        }
      )

      return false
    }

    if (+orderQuantityMinimum > 0 && +quantity < orderQuantityMinimum) {
      snackbar.error(
        b3Lang('purchasedProducts.quickOrderPad.minQuantityMessage', {
          minQuantity: orderQuantityMinimum,
          sku: productSku,
        }),
        {
          isClose: true,
        }
      )

      return false
    }

    if (+orderQuantityMaximum > 0 && +quantity > +orderQuantityMaximum) {
      snackbar.error(
        b3Lang('purchasedProducts.quickOrderPad.minQuantityMessage', {
          maxQuantity: orderQuantityMaximum,
          sku: productSku,
        }),
        {
          isClose: true,
        }
      )

      return false
    }

    return true
  }

  const handleQuickSearchAddCart = async (productData: CustomFieldItems[]) => {
    const currentProduct = productData[0]
    const isPassVerify = handleVerifyProduct(currentProduct)
    try {
      if (isPassVerify) {
        await quickAddToList(productData)
      }
    } catch (error) {
      console.error(error)
    }

    return productData
  }

  const handleOpenUploadDiag = () => {
    const companyStatus = B3SStorage.get('companyStatus')
    if (blockPendingAccountViewPrice && companyStatus === 0) {
      snackbar.info(
        'Your business account is pending approval. This feature is currently disabled.'
      )
    } else {
      setIsOpenBulkLoadCSV(true)
    }
  }

  useEffect(() => {
    if (productData?.length > 0) {
      setAddBtnText(
        b3Lang('purchasedProducts.quickOrderPad.addNProductsToCart', {
          quantity: productData.length,
        })
      )
    }
  }, [productData])

  return (
    <Card
      sx={{
        marginBottom: isMobile ? '8.5rem' : '50px',
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
            {b3Lang('purchasedProducts.quickOrderPad.quickOrderPad')}
          </Typography>

          <SearchProduct
            addToList={handleQuickSearchAddCart}
            searchDialogTitle={b3Lang(
              'purchasedProducts.quickOrderPad.quickOrderPad'
            )}
            addButtonText={b3Lang(
              'purchasedProducts.quickOrderPad.quickOrderPad'
            )}
            isB2BUser={isB2BUser}
          />

          <Divider />

          <QuickAdd
            quickAddToList={quickAddToList}
            buttonText={b3Lang(
              'purchasedProducts.quickOrderPad.addProductsToCart'
            )}
          />

          <Divider />

          <Box
            sx={{
              margin: '20px 0 0',
            }}
          >
            <CustomButton variant="text" onClick={() => handleOpenUploadDiag()}>
              <UploadFileIcon
                sx={{
                  marginRight: '8px',
                }}
              />
              {b3Lang('purchasedProducts.quickOrderPad.bulkUploadCSV')}
            </CustomButton>
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
        isToCart
      />
    </Card>
  )
}
