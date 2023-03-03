import {
  Divider,
  Card,
  CardContent,
} from '@mui/material'

import {
  v1 as uuid,
} from 'uuid'

import {
  B3CollapseContainer,
} from '@/components'

import {
  snackbar,
} from '@/utils'

import {
  searchB2BProducts,
} from '@/shared/service/b2b'

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

  const getNewQuoteProduct = (products: CustomFieldItems[]) => products.map((product) => {
    const {
      variantId,
      newSelectOptionList,
      id: productId,
      name: productName,
      quantity,
      variants = [],
    } = product

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
        basePrice,
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
        </B3CollapseContainer>
      </CardContent>
    </Card>
  )
}
