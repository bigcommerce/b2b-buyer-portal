import {
  ChangeEvent,
  KeyboardEvent,
  useContext,
} from 'react'

import {
  TextField,
  InputAdornment,
  Button,
  Box,
  Typography,
} from '@mui/material'

import SearchIcon from '@mui/icons-material/Search'

import {
  B3Dialog,
  B3ProductList,
  B3Sping,
} from '@/components'

import {
  useMobile,
} from '@/hooks'

import {
  snackbar,
} from '@/utils'

import {
  ShoppingListDetailsContext,
} from '../context/ShoppingListDetailsContext'

import {
  ShoppingListProductItem,
  ShoppingListAddProductItem,
} from '../../../types'

interface ProductTableActionProps {
  product: ShoppingListProductItem,
  onAddToListClick: (id: number) => void,
  onChooseOptionsClick: (id: number) => void,
}

const ProductTableAction = (props: ProductTableActionProps) => {
  const {
    product: {
      id,
      allOptions: productOptions,
    },
    onAddToListClick,
    onChooseOptionsClick,
  } = props

  const {
    state: {
      isLoading = false,
    },
  } = useContext(ShoppingListDetailsContext)

  const [isMobile] = useMobile()

  return (
    productOptions && productOptions.length > 0
      ? (
        <Button
          variant="outlined"
          onClick={() => {
            onChooseOptionsClick(id)
          }}
          disabled={isLoading}
          fullWidth={isMobile}
        >
          Choose options
        </Button>
      )
      : (
        <Button
          variant="outlined"
          onClick={() => {
            onAddToListClick(id)
          }}
          disabled={isLoading}
          fullWidth={isMobile}
        >
          Add to list

        </Button>

      )
  )
}

interface ProductListDialogProps {
  isOpen: boolean,
  searchText: string,
  productList: ShoppingListProductItem[],
  onCancel: () => void,
  onSearchTextChange: (e: ChangeEvent<HTMLInputElement>) => void,
  onSearch: () => void,
  onProductQuantityChange: (id: number, newQuantity: number) => void,
  onAddToListClick: (products: ShoppingListAddProductItem[]) => void,
  onChooseOptionsClick: (id: number) => void,
}

const ProductTable = B3ProductList<ShoppingListProductItem>

export const ProductListDialog = (props: ProductListDialogProps) => {
  const {
    isOpen,
    onCancel,
    searchText,
    productList,
    onSearchTextChange,
    onSearch,
    onProductQuantityChange,
    onAddToListClick,
    onChooseOptionsClick,
  } = props

  const {
    state: {
      isLoading = false,
    },
  } = useContext(ShoppingListDetailsContext)

  const [isMobile] = useMobile()

  const handleCancelClicked = () => {
    onCancel()
  }

  const handleSearchKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch()
    }
  }

  const validateQuantityNumber = (product: ShoppingListProductItem) => {
    const {
      variants = [],
    } = product || {}

    const {
      purchasing_disabled: purchasingDisabled = true,
    } = variants[0] || {}

    if (purchasingDisabled === true) {
      snackbar.error('This product is no longer for sale')
      return false
    }

    return true
  }

  const handleAddToList = (id: number) => {
    const product = productList.find((product) => product.id === id)

    if (product && validateQuantityNumber(product || {})) {
      onAddToListClick([{
        optionList: [],
        productId: id,
        quantity: parseInt(product.quantity.toString(), 10) || 1,
        variantId: id,
      }])
    }
  }

  return (
    <B3Dialog
      isOpen={isOpen}
      handleLeftClick={handleCancelClicked}
      title="Add to list"
      showRightBtn={false}
      loading={isLoading}
      maxWidth="lg"
    >
      <B3Sping
        isSpinning={isLoading}
      >
        <Box sx={{
          minWidth: isMobile ? 'initial' : '850px',
          flex: 1,
        }}
        >
          <TextField
            hiddenLabel
            variant="filled"
            fullWidth
            size="small"
            value={searchText}
            onChange={onSearchTextChange}
            onKeyDown={handleSearchKeyDown}
            error={!productList || productList.length <= 0}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{
              margin: '12px 0',
              '& input': {
                padding: '12px 12px 12px 0',
              },
            }}
          />

          {
            productList && productList.length > 0 ? (
              <ProductTable
                products={productList}
                quantityEditable
                onProductQuantityChange={onProductQuantityChange}
                renderAction={(product) => (
                  <ProductTableAction
                    product={product}
                    onAddToListClick={handleAddToList}
                    onChooseOptionsClick={onChooseOptionsClick}
                  />
                )}
                actionWidth="180px"
              />
            ) : (
              <Typography>
                No products found
              </Typography>
            )
          }
        </Box>
      </B3Sping>
    </B3Dialog>
  )
}
