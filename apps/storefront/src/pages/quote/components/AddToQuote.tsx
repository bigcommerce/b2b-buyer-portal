import {
  useState,
} from 'react'

import {
  Divider,
  Card,
  CardContent,
  Box,
  Button,
} from '@mui/material'

import UploadFileIcon from '@mui/icons-material/UploadFile'

import {
  v1 as uuid,
} from 'uuid'

import {
  B3Upload,
  B3CollapseContainer,
} from '@/components'

import {
  snackbar,
  addQuoteDraftProduce,
} from '@/utils'

import {
  PRODUCT_DEFAULT_IMAGE,
} from '@/constants'

import {
  searchB2BProducts,
  searchBcProducts,
} from '@/shared/service/b2b'

import {
  conversionProductsList,
} from '../../shoppingListDetails/shared/config'

import {
  SearchProduct,
} from '../../shoppingListDetails/components/SearchProduct'

import {
  QuickAdd,
} from '../../shoppingListDetails/components/QuickAdd'

interface AddToListProps {
  updateList: () => void
  addToQuote: (products: CustomFieldItems[]) => void,
  isB2BUser: boolean,
}

export const AddToQuote = (props: AddToListProps) => {
  const {
    updateList,
    addToQuote,
    isB2BUser,
  } = props

  const [isOpenBulkLoadCSV, setIsOpenBulkLoadCSV] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const getNewQuoteProduct = (products: CustomFieldItems[]) => products.map((product) => {
    const {
      variantId,
      newSelectOptionList,
      id: productId,
      name: productName,
      quantity,
      variants = [],
      allOptions,
      additionalProducts,
    } = product

    const productListWithImages = allOptions.find((item: CustomFieldItems) => item.type === 'product_list_with_images')

    let additionalCalculatedPrice = 0
    let additionalCalculatedPriceTax = 0

    if (productListWithImages) {
      const optionId = productListWithImages.id
      const optionValues = productListWithImages?.option_values || []
      const productListWithImagesValue = newSelectOptionList.find((item: CustomFieldItems) => item.optionId.includes(optionId))?.optionValue || ''
      if (productListWithImagesValue) {
        const productId = optionValues.find((item: CustomFieldItems) => item.id.toString() === productListWithImagesValue)?.value_data?.product_id || ''
        if (additionalProducts[productId]) {
          const additionalSku = additionalProducts[productId].sku
          const additionalVariants = additionalProducts[productId].variants
          const additionalCalculatedItem = additionalVariants.find((item: CustomFieldItems) => item.sku === additionalSku)
          if (additionalCalculatedItem) {
            additionalCalculatedPrice = additionalCalculatedItem.calculated_price
            additionalCalculatedPriceTax = additionalCalculatedItem.bc_calculated_price.tax_inclusive - additionalCalculatedItem.bc_calculated_price.tax_exclusive
          }
        }
      }
    }

    const variantInfo = variants.length === 1 ? variants[0] : variants.find((item: CustomFieldItems) => item.variant_id === variantId)

    const {
      image_url: primaryImage = '',
      calculated_price: basePrice,
      sku: variantSku,
    } = variantInfo

    let selectOptions
    try {
      selectOptions = JSON.stringify(newSelectOptionList)
    } catch (error) {
      selectOptions = '[]'
    }

    return {
      node: {
        basePrice: (additionalCalculatedPrice + basePrice).toFixed(2),
        additionalCalculatedPrice,
        additionalCalculatedPriceTax,
        optionList: selectOptions,
        id: uuid(),
        primaryImage,
        productId,
        productName,
        productsSearch: {
          ...product,
          selectOptions,
        },
        quantity,
        variantSku,
      },
    }
  })

  const addToList = async (products: CustomFieldItems[]) => {
    const newProducts = getNewQuoteProduct(products)

    addToQuote(newProducts)

    snackbar.success('Product were added to your quote.')

    return products
  }

  const quickAddToList = async (variantProducts: CustomFieldItems[]) => {
    const productIds = variantProducts.map((item) => item.productId)

    const {
      productsSearch,
    } : CustomFieldItems = await searchB2BProducts({
      productIds,
    })

    const productList = productsSearch.map((product: CustomFieldItems) => {
      const variantProduct = variantProducts.find((variantProduct: CustomFieldItems) => variantProduct.productId === product.id) || {}

      const {
        variantId,
        newSelectOptionList,
        quantity,
      } = variantProduct

      return {
        ...product,
        variantId,
        newSelectOptionList,
        quantity,
      }
    })

    const newProducts = getNewQuoteProduct(productList)

    addToQuote(newProducts)

    snackbar.success('Products were added to your quote.')

    return variantProducts
  }

  const getOptionsList = (options: CustomFieldItems) => {
    if (options?.length === 0) return []

    const option = options.map(({
      option_id: optionId,
      id,
    }: {
      option_id: number | string,
      id: string | number,
    }) => ({
      optionId: `attribute[${optionId}]`,
      optionValue: id,
    }))

    return option
  }

  const handleCSVAddToList = async (productsData: CustomFieldItems) => {
    setIsLoading(true)
    try {
      const {
        validProduct,
      } = productsData

      const productIds: number[] = []
      validProduct.forEach((product: CustomFieldItems) => {
        const {
          products,
        } = product

        if (!productIds.includes(+products.productId)) {
          productIds.push(+products.productId)
        }
      })

      const getProducts = isB2BUser ? searchB2BProducts : searchBcProducts

      const {
        productsSearch,
      } = await getProducts({
        productIds,
      })

      const newProductInfo: CustomFieldItems = conversionProductsList(productsSearch)

      let isSuccess = false
      validProduct.forEach((product: CustomFieldItems) => {
        const {
          products: {
            option,
            variantSku,
            productId,
            productName,
            variantId,
          },
          qty,
        } = product

        const optionsList = getOptionsList(option)

        const currentProductSearch = newProductInfo.find((product: CustomFieldItems) => +product.id === +productId)

        const variantItem = currentProductSearch.variants.find((item: CustomFieldItems) => item.sku === variantSku)

        const quoteListitem = {
          node: {
            id: uuid(),
            variantSku: variantItem.sku,
            variantId,
            productsSearch: currentProductSearch,
            primaryImage: variantItem.image_url || PRODUCT_DEFAULT_IMAGE,
            productName,
            quantity: +qty || 1,
            optionList: JSON.stringify(optionsList),
            productId,
            basePrice: variantItem.bc_calculated_price.as_entered,
            tax: variantItem.bc_calculated_price.tax_inclusive - variantItem.bc_calculated_price.tax_exclusive,
          },
        }

        addQuoteDraftProduce(quoteListitem, +qty, optionsList || [])

        isSuccess = true
      })

      if (isSuccess) {
        snackbar.success('Products were added to your quote.')
        updateList()
        setIsOpenBulkLoadCSV(false)
      }
    } catch (e) {
      console.log(e)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardContent>
        <B3CollapseContainer title="Add to quote">
          <SearchProduct
            updateList={updateList}
            addToList={addToList}
            searchDialogTitle="Add to quote"
            addButtonText="Add to Quote"
            isB2BUser={isB2BUser}
          />

          <Divider />

          <QuickAdd
            updateList={updateList}
            quickAddToList={quickAddToList}
            level={1}
            buttonText="Add products to Quote"
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

          <B3Upload
            isOpen={isOpenBulkLoadCSV}
            setIsOpen={setIsOpenBulkLoadCSV}
            handleAddToList={handleCSVAddToList}
            isLoading={isLoading}
          />
        </B3CollapseContainer>
      </CardContent>
    </Card>
  )
}
