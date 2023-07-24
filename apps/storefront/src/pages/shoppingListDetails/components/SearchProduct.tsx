import { ChangeEvent, KeyboardEvent, useState } from 'react'
import SearchIcon from '@mui/icons-material/Search'
import { Box, InputAdornment, TextField, Typography } from '@mui/material'

import { B3Sping, CustomButton } from '@/components'
import { searchB2BProducts, searchBcProducts } from '@/shared/service/b2b'
import { B3SStorage, calculateProductListPrice, snackbar } from '@/utils'
import { conversionProductsList } from '@/utils/b3Product/shared/config'

import { ShoppingListProductItem } from '../../../types'

import ChooseOptionsDialog from './ChooseOptionsDialog'
import ProductListDialog from './ProductListDialog'

interface SearchProductProps {
  updateList?: () => void
  addToList: (products: CustomFieldItems[]) => CustomFieldItems
  searchDialogTitle?: string
  addButtonText?: string
  isB2BUser: boolean
}

export default function SearchProduct({
  updateList = () => {},
  addToList,
  searchDialogTitle,
  addButtonText,
  isB2BUser,
}: SearchProductProps) {
  const [isLoading, setIsLoading] = useState(false)

  const [productListOpen, setProductListOpen] = useState(false)
  const [isAdded, setIsAdded] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [productList, setProductList] = useState<ShoppingListProductItem[]>([])
  const [chooseOptionsOpen, setChooseOptionsOpen] = useState(false)
  const [optionsProduct, setOptionsProduct] =
    useState<ShoppingListProductItem>()

  const handleSearchTextChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value)
  }

  const searchProduct = async () => {
    if (!searchText || isLoading) {
      return
    }

    const blockPendingAccountViewPrice = B3SStorage.get(
      'blockPendingAccountViewPrice'
    )
    if (blockPendingAccountViewPrice) {
      snackbar.info(
        'Your business account is pending approval. This feature is currently disabled.'
      )
      return
    }

    const companyId =
      B3SStorage.get('B3CompanyInfo')?.id || B3SStorage.get('salesRepCompanyId')
    const customerGroupId = B3SStorage.get('B3CustomerInfo')?.customerGroupId
    const getProducts = isB2BUser ? searchB2BProducts : searchBcProducts

    setIsLoading(true)
    try {
      const { productsSearch }: CustomFieldItems = await getProducts({
        search: searchText,
        companyId,
        customerGroupId,
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

  const handleAddToListClick = async (products: CustomFieldItems[]) => {
    try {
      setIsLoading(true)
      await calculateProductListPrice(products)
      await addToList(products)

      updateList()
    } finally {
      setIsLoading(false)
    }
  }

  const handleProductListAddToList = async (products: CustomFieldItems[]) => {
    await handleAddToListClick(products)
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

  const handleChooseOptionsDialogConfirm = async (
    products: CustomFieldItems[]
  ) => {
    try {
      setIsLoading(true)
      await calculateProductListPrice(products)
      await handleAddToListClick(products)
      setChooseOptionsOpen(false)
      setProductListOpen(true)
    } catch (error) {
      setIsLoading(false)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Box
      sx={{
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
      <CustomButton
        variant="outlined"
        fullWidth
        disabled={isLoading}
        onClick={handleSearchButtonClicked}
      >
        <B3Sping isSpinning={isLoading} tip="" size={16}>
          <Box
            sx={{
              flex: 1,
              textAlign: 'center',
            }}
          >
            Search product
          </Box>
        </B3Sping>
      </CustomButton>

      <ProductListDialog
        isOpen={productListOpen}
        isLoading={isLoading}
        productList={productList}
        searchText={searchText}
        onSearchTextChange={handleSearchTextChange}
        onSearch={handleSearchButtonClicked}
        onCancel={handleProductListDialogCancel}
        onProductQuantityChange={handleProductQuantityChange}
        onChooseOptionsClick={handleChangeOptionsClick}
        onAddToListClick={handleProductListAddToList}
        searchDialogTitle={searchDialogTitle}
        addButtonText={addButtonText}
      />

      <ChooseOptionsDialog
        isOpen={chooseOptionsOpen}
        isLoading={isLoading}
        setIsLoading={setIsLoading}
        product={optionsProduct}
        onCancel={handleChooseOptionsDialogCancel}
        onConfirm={handleChooseOptionsDialogConfirm}
        addButtonText={addButtonText}
        isB2BUser={isB2BUser}
      />
    </Box>
  )
}
