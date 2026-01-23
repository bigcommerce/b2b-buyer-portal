import { ChangeEvent, KeyboardEvent, useState } from 'react';
import { Search as SearchIcon } from '@mui/icons-material';
import { Box, InputAdornment, TextField, Typography } from '@mui/material';

import CustomButton from '@/components/button/CustomButton';
import B3Spin from '@/components/spin/B3Spin';
import { useBlockPendingAccountViewPrice } from '@/hooks/useBlockPendingAccountViewPrice';
import { useB3Lang } from '@/lib/lang';
import { searchProducts } from '@/shared/service/b2b';
import { useAppSelector } from '@/store';
import { calculateProductListPrice } from '@/utils/b3Product/b3Product';
import { conversionProductsList } from '@/utils/b3Product/shared/config';
import { snackbar } from '@/utils/b3Tip';

import { ShoppingListProductItem } from '../../../types';

import ChooseOptionsDialog from './ChooseOptionsDialog';
import ProductListDialog from './ProductListDialog';

interface SearchProductProps {
  addToList: (product: CustomFieldItems) => Promise<void>;
}

export default function SearchProduct({ addToList }: SearchProductProps) {
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

  const handleAddToListClick = async (product: CustomFieldItems) => {
    try {
      setIsLoading(true);
      await calculateProductListPrice([product]);
      await addToList(product);
    } finally {
      setIsLoading(false);
    }
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

  const handleChooseOptionsDialogConfirm = async (product: CustomFieldItems) => {
    try {
      setIsLoading(true);
      await calculateProductListPrice([product]);
      await handleAddToListClick(product);
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
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
        fullWidth
        hiddenLabel
        onChange={handleSearchTextChange}
        onKeyDown={handleSearchTextKeyDown}
        placeholder={b3Lang('global.searchProduct.placeholder.quickOrder')}
        size="small"
        sx={{
          margin: '12px 0',
          '& input': {
            padding: '12px 12px 12px 0',
          },
        }}
        value={searchText}
        variant="filled"
      />
      <CustomButton
        disabled={isLoading}
        fullWidth
        onClick={handleSearchButtonClicked}
        variant="outlined"
      >
        <B3Spin isSpinning={isLoading} size={16} tip="">
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
        isLoading={isLoading}
        isOpen={productListOpen}
        onAddToListClick={handleAddToListClick}
        onCancel={handleProductListDialogCancel}
        onChooseOptionsClick={handleChangeOptionsClick}
        onProductQuantityChange={handleProductQuantityChange}
        onSearch={handleSearchButtonClicked}
        onSearchTextChange={handleSearchTextChange}
        productList={productList}
        searchText={searchText}
      />

      <ChooseOptionsDialog
        isLoading={isLoading}
        isOpen={chooseOptionsOpen}
        onCancel={handleChooseOptionsDialogCancel}
        onConfirm={handleChooseOptionsDialogConfirm}
        product={optionsProduct}
        setIsLoading={setIsLoading}
      />
    </Box>
  );
}
