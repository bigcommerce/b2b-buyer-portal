import { useContext, useState } from 'react'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import { Box, Card, CardContent, Divider } from '@mui/material'
import { v1 as uuid } from 'uuid'

import { B3CollapseContainer, B3Upload, CustomButton } from '@/components'
import { PRODUCT_DEFAULT_IMAGE } from '@/constants'
import { useBlockPendingAccountViewPrice } from '@/hooks'
import { GlobaledContext } from '@/shared/global'
import { searchB2BProducts, searchBcProducts } from '@/shared/service/b2b'
import {
  addQuoteDraftProducts,
  B3SStorage,
  calculateProductListPrice,
  snackbar,
  validProductQty,
} from '@/utils'
import { conversionProductsList } from '@/utils/b3Product/shared/config'

import QuickAdd from '../../shoppingListDetails/components/QuickAdd'
import SearchProduct from '../../shoppingListDetails/components/SearchProduct'

interface AddToListProps {
  updateList: () => void
  addToQuote: (products: CustomFieldItems[]) => void
  isB2BUser: boolean
}

export default function AddToQuote(props: AddToListProps) {
  const { updateList, addToQuote, isB2BUser } = props

  const {
    state: {
      companyInfo: { id: companyId },
      customer: { customerGroupId },
    },
  } = useContext(GlobaledContext)

  const [isOpenBulkLoadCSV, setIsOpenBulkLoadCSV] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [blockPendingAccountViewPrice] = useBlockPendingAccountViewPrice()

  const getNewQuoteProduct = (products: CustomFieldItems[]) =>
    products.map((product) => {
      const {
        variantId,
        newSelectOptionList,
        id: productId,
        name: productName,
        quantity,
        variants = [],
        basePrice,
        taxPrice,
        calculatedValue,
      } = product

      const variantInfo =
        variants.length === 1
          ? variants[0]
          : variants.find(
              (item: CustomFieldItems) => item.variant_id === variantId
            )

      const { image_url: primaryImage = '', sku: variantSku } = variantInfo

      let selectOptions
      try {
        selectOptions = JSON.stringify(newSelectOptionList)
      } catch (error) {
        selectOptions = '[]'
      }

      const taxExclusive = variantInfo.bc_calculated_price.tax_exclusive
      const taxInclusive = variantInfo.bc_calculated_price.tax_inclusive

      const basePriceExclusiveTax = basePrice || taxExclusive

      const tax = taxPrice || +taxInclusive - +taxExclusive

      return {
        node: {
          basePrice: basePriceExclusiveTax,
          taxPrice: tax,
          optionList: selectOptions,
          id: uuid(),
          primaryImage,
          productId,
          productName,
          calculatedValue,
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

    const noSkuProducts = products.filter(({ sku }) => !sku)
    if (noSkuProducts.length > 0) {
      snackbar.error('Can not add products without SKU.', {
        isClose: true,
      })
    }

    if (noSkuProducts.length === products.length) return []

    addToQuote(newProducts)

    snackbar.success('Product were added to your quote.', {
      isClose: true,
    })

    return products
  }

  const quickAddToList = async (variantProducts: CustomFieldItems[]) => {
    const productIds = variantProducts.map((item) => item.productId)

    const { productsSearch }: CustomFieldItems = await searchB2BProducts({
      productIds,
      companyId,
      customerGroupId,
    })

    const productList = productsSearch.map((product: CustomFieldItems) => {
      const variantProduct =
        variantProducts.find(
          (variantProduct: CustomFieldItems) =>
            variantProduct.productId === product.id
        ) || {}

      const { variantId, newSelectOptionList, quantity } = variantProduct

      return {
        ...product,
        variantId,
        newSelectOptionList,
        quantity,
      }
    })

    await calculateProductListPrice(productList)

    const newProducts = getNewQuoteProduct(productList)

    addToQuote(newProducts)

    snackbar.success('Products were added to your quote.', {
      isClose: true,
    })

    return variantProducts
  }

  const getOptionsList = (options: CustomFieldItems) => {
    if (options?.length === 0) return []

    const option = options.map(
      ({
        option_id: optionId,
        id,
      }: {
        option_id: number | string
        id: string | number
      }) => ({
        optionId: `attribute[${optionId}]`,
        optionValue: id,
      })
    )

    return option
  }

  const handleCSVAddToList = async (productsData: CustomFieldItems) => {
    setIsLoading(true)
    try {
      const { validProduct } = productsData

      const productIds: number[] = []
      validProduct.forEach((product: CustomFieldItems) => {
        const { products } = product

        if (!productIds.includes(+products.productId)) {
          productIds.push(+products.productId)
        }
      })

      const getProducts = isB2BUser ? searchB2BProducts : searchBcProducts

      const { productsSearch } = await getProducts({
        productIds,
        companyId,
        customerGroupId,
      })

      const newProductInfo: CustomFieldItems =
        conversionProductsList(productsSearch)

      let isSuccess = false

      const newProducts: CustomFieldItems[] = []
      validProduct.forEach((product: CustomFieldItems) => {
        const {
          products: { option, variantSku, productId, productName, variantId },
          qty,
        } = product

        const optionsList = getOptionsList(option)

        const currentProductSearch = newProductInfo.find(
          (product: CustomFieldItems) => +product.id === +productId
        )

        const variantItem = currentProductSearch.variants.find(
          (item: CustomFieldItems) => item.sku === variantSku
        )

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
            tax:
              variantItem.bc_calculated_price.tax_inclusive -
              variantItem.bc_calculated_price.tax_exclusive,
          },
        }

        newProducts.push(quoteListitem)

        isSuccess = true
      })
      isSuccess = validProductQty(newProducts)
      if (isSuccess) {
        await calculateProductListPrice(newProducts, '2')

        addQuoteDraftProducts(newProducts)
        snackbar.success('Products were added to your quote.', {
          isClose: true,
        })
        updateList()
        setIsOpenBulkLoadCSV(false)
      } else {
        snackbar.error('The quantity of each product in Quote is 1-1000000.')
      }
    } catch (e) {
      console.log(e)
    } finally {
      setIsLoading(false)
    }
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
              Bulk upload CSV
            </CustomButton>
          </Box>

          <B3Upload
            isOpen={isOpenBulkLoadCSV}
            setIsOpen={setIsOpenBulkLoadCSV}
            handleAddToList={handleCSVAddToList}
            isLoading={isLoading}
            withModifiers
          />
        </B3CollapseContainer>
      </CardContent>
    </Card>
  )
}
