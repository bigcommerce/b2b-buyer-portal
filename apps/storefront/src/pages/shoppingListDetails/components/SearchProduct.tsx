import {
  ChangeEvent,
  KeyboardEvent,
  useState,
  useContext,
} from 'react'

import {
  Box,
  Typography,
  TextField,
  Button,
  InputAdornment,
} from '@mui/material'

import SearchIcon from '@mui/icons-material/Search'

import {
  snackbar,
} from '@/utils'

import {
  B3Sping,
} from '@/components'

import {
  ProductListDialog,
} from './ProductListDialog'

import {
  ChooseOptionsDialog,
} from './ChooseOptionsDialog'

import {
  ShoppingListDetailsContext,
} from '../context/ShoppingListDetailsContext'

import {
  ShoppingListProductItem,
  ShoppingListAddProductItem,
} from '../../../types'

import {
  addProductToShoppingList,
  searchB2BProducts,
} from '@/shared/service/b2b'

import {
  conversionProductsList,
} from '../shared/config'

interface SearchProductProps {
  updateList: () => void
}

export const SearchProduct = ({
  updateList,
}: SearchProductProps) => {
  const {
    state: {
      id,
      isLoading = false,
    },
    dispatch,
  } = useContext(ShoppingListDetailsContext)

  const [productListOpen, setProductListOpen] = useState(false)
  const [isAdded, setIsAdded] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [productList, setProductList] = useState<ShoppingListProductItem[]>([])
  const [chooseOptionsOpen, setChooseOptionsOpen] = useState(false)
  const [optionsProduct, setOptionsProduct] = useState<ShoppingListProductItem>()

  const handleSearchTextChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value)
  }

  const setIsLoading = (isLoading: boolean) => {
    dispatch({
      type: 'loading',
      payload: {
        isLoading,
      },
    })
  }

  const searchProduct = async () => {
    if (!searchText || isLoading) {
      return
    }

    setIsLoading(true)
    try {
      const {
        productsSearch,
      } : CustomFieldItems = await searchB2BProducts({
        search: searchText,
      })

      const product = conversionProductsList(productsSearch)

      setProductList(product)
      setProductListOpen(true)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearchTextKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchProduct()
    }
  }

  const handleSearchButtonClicked = () => {
    searchProduct()
  }

  const clearProductInfo = () => {
    setProductList([])
  }

  const handleProductListDialogCancel = () => {
    setChooseOptionsOpen(false)
    setProductListOpen(false)

    if (isAdded) {
      setIsAdded(false)
      updateList()
    }

    clearProductInfo()
  }

  const handleProductQuantityChange = (id: number, newQuantity: number) => {
    const product = productList.find((product) => product.id === id)
    if (product) {
      product.quantity = newQuantity
    }

    setProductList([...productList])
  }

  const handleAddToListClick = async (products: ShoppingListAddProductItem[]) => {
    try {
      setIsLoading(true)
      await addProductToShoppingList({
        shoppingListId: id,
        items: products,
      })

      setIsAdded(true)

      snackbar.success('Product were added to your shopping list')
    } finally {
      setIsLoading(false)
    }
  }

  const handleProductListAddToList = (products: ShoppingListAddProductItem[]) => {
    handleAddToListClick(products)
    // setChooseOptionsOpen(false)
    // setProductListOpen(false)
  }

  const handleChangeOptionsClick = (productId: number) => {
    const product = productList.find((product) => product.id === productId)
    if (product) {
      setOptionsProduct({
        ...product,
      })
    }
    setProductListOpen(false)
    setChooseOptionsOpen(true)
  }

  const handleChooseOptionsDialogCancel = () => {
    setChooseOptionsOpen(false)
    setProductListOpen(true)
  }

  const handleChooseOptionsDialogConfirm = (products: ShoppingListAddProductItem[]) => {
    handleAddToListClick(products)
    setChooseOptionsOpen(false)
    setProductListOpen(true)
  }

  return (
    <Box sx={{
      margin: '24px 0',
    }}
    >
      <Typography>Search by SKU or product name</Typography>
      <TextField
        hiddenLabel
        placeholder="eg Towel"
        variant="filled"
        fullWidth
        size="small"
        value={searchText}
        onChange={handleSearchTextChange}
        onKeyDown={handleSearchTextKeyDown}
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
      <Button
        variant="outlined"
        fullWidth
        disabled={isLoading}
        onClick={handleSearchButtonClicked}
      >
        <B3Sping
          isSpinning={isLoading}
          tip=""
          size={16}
        >
          <Box
            sx={{
              flex: 1,
              textAlign: 'center',
            }}
          >
            Search product
          </Box>
        </B3Sping>
      </Button>

      <ProductListDialog
        isOpen={productListOpen}
        productList={productList}
        searchText={searchText}
        onSearchTextChange={handleSearchTextChange}
        onSearch={handleSearchButtonClicked}
        onCancel={handleProductListDialogCancel}
        onProductQuantityChange={handleProductQuantityChange}
        onChooseOptionsClick={handleChangeOptionsClick}
        onAddToListClick={handleProductListAddToList}
      />

      <ChooseOptionsDialog
        isOpen={chooseOptionsOpen}
        product={optionsProduct}
        onCancel={handleChooseOptionsDialogCancel}
        onConfirm={handleChooseOptionsDialogConfirm}
      />

    </Box>
  )
}
