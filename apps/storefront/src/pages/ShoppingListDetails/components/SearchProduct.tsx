import { ChangeEvent, KeyboardEvent, useState } from 'react';
import { Search as SearchIcon } from '@mui/icons-material';
import { Box, InputAdornment, TextField, Typography } from '@mui/material';

import CustomButton from '@/components/button/CustomButton';
import B3Spin from '@/components/spin/B3Spin';
import { useBlockPendingAccountViewPrice } from '@/hooks';
import { useB3Lang } from '@/lib/lang';
import { searchProducts } from '@/shared/service/b2b';
import { useAppSelector } from '@/store';
import { snackbar } from '@/utils';
import { calculateProductListPrice } from '@/utils/b3Product/b3Product';
import { conversionProductsList } from '@/utils/b3Product/shared/config';

import { ShoppingListProductItem } from '../../../types';

import ChooseOptionsDialog from './ChooseOptionsDialog';
import ProductListDialog from './ProductListDialog';

interface SearchProductProps {
  updateList?: () => void;
  addToList: (products: CustomFieldItems[]) => Promise<void>;
  searchDialogTitle?: string;
  addButtonText?: string;
  type?: string;
}

export default function SearchProduct({
  updateList = () => {},
  addToList,
  searchDialogTitle,
  addButtonText,
  type,
}: SearchProductProps) {
  const b3Lang = useB3Lang();
  const companyInfoId = useAppSelector(({ company }) => company.companyInfo.id);
  const customerGroupId = useAppSelector((state) => state.company.customer.customerGroupId);
  const companyStatus = useAppSelector(({ company }) => company.companyInfo.status);
  const salesRepCompanyId = useAppSelector(({ b2bFeatures }) => b2bFeatures.masqueradeCompany.id);
  const companyId = companyInfoId || salesRepCompanyId;
  const [isLoading, setIsLoading] = useState(false);
  const [productListOpen, setProductListOpen] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [productList, setProductList] = useState<ShoppingListProductItem[]>([]);
  const [chooseOptionsOpen, setChooseOptionsOpen] = useState(false);
  const [optionsProduct, setOptionsProduct] = useState<ShoppingListProductItem>();

  const [blockPendingAccountViewPrice] = useBlockPendingAccountViewPrice();

  const handleSearchTextChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  const searchProduct = async () => {
    if (!searchText || isLoading) {
      return;
    }

    if (blockPendingAccountViewPrice && companyStatus === 0) {
      snackbar.info(b3Lang('global.searchProductAddProduct.businessAccountPendingApproval'));
      return;
    }

    setIsLoading(true);
    try {
      const { productsSearch } = await searchProducts({
        search: searchText,
        companyId,
        customerGroupId,
        categoryFilter: true,
      });

      const product = conversionProductsList(productsSearch);

      setProductList(product);
      setProductListOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchTextKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchProduct();
    }
  };

  const handleSearchButtonClicked = () => {
    searchProduct();
  };

  const clearProductInfo = () => {
    setProductList([]);
  };

  const handleProductListDialogCancel = () => {
    setChooseOptionsOpen(false);
    setProductListOpen(false);

    if (isAdded) {
      setIsAdded(false);
      updateList();
    }

    clearProductInfo();
  };

  const handleProductQuantityChange = (id: number, newQuantity: number) => {
    const product = productList.find((product) => product.id === id);
    if (product) {
      product.quantity = newQuantity;
    }

    setProductList([...productList]);
  };

  const handleAddToListClick = async (products: CustomFieldItems[]) => {
    try {
      setIsLoading(true);
      await calculateProductListPrice(products);
      await addToList(products);

      updateList();
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductListAddToList = async (products: CustomFieldItems[]) => {
    await handleAddToListClick(products);
  };

  const handleChangeOptionsClick = (productId: number) => {
    const product = productList.find((product) => product.id === productId);
    if (product) {
      setOptionsProduct({
        ...product,
      });
    }
    setProductListOpen(false);
    setChooseOptionsOpen(true);
  };

  const handleChooseOptionsDialogCancel = () => {
    setChooseOptionsOpen(false);
    setProductListOpen(true);
  };

  const handleChooseOptionsDialogConfirm = async (products: CustomFieldItems[]) => {
    try {
      setIsLoading(true);
      await calculateProductListPrice(products);
      await handleAddToListClick(products);
      setChooseOptionsOpen(false);
      setProductListOpen(true);
    } catch (error) {
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        margin: '24px 0',
      }}
    >
      <Typography>{b3Lang('global.searchProductAddProduct.searchBySkuOrName')}</Typography>
      <TextField
        hiddenLabel
        placeholder={b3Lang(`global.searchProduct.placeholder.${type}`)}
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
        <B3Spin isSpinning={isLoading} tip="" size={16}>
          <Box
            sx={{
              flex: 1,
              textAlign: 'center',
            }}
          >
            {b3Lang('global.searchProductAddProduct.searchProduct')}
          </Box>
        </B3Spin>
      </CustomButton>

      <ProductListDialog
        isOpen={productListOpen}
        isLoading={isLoading}
        productList={productList}
        searchText={searchText}
        type={type}
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
        type={type}
        setIsLoading={setIsLoading}
        product={optionsProduct}
        onCancel={handleChooseOptionsDialogCancel}
        onConfirm={handleChooseOptionsDialogConfirm}
        addButtonText={addButtonText}
      />
    </Box>
  );
}
