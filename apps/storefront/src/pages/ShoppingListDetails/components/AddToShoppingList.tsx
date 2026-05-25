import { useState } from 'react';
import { UploadFile as UploadFileIcon } from '@mui/icons-material';
import { Box, Card, CardContent, Divider, Typography } from '@mui/material';

import CustomButton from '@/components/button/CustomButton';
import { B3Upload } from '@/components/upload/B3Upload';
import { dispatchEvent } from '@/hooks/useB2BCallback';
import { useBlockPendingAccountViewPrice } from '@/hooks/useBlockPendingAccountViewPrice';
import { useB3Lang } from '@/lib/lang';
import { addProductToBcShoppingList, addProductToShoppingList } from '@/shared/service/b2b';
import { useAppSelector } from '@/store';
import { getValidOptionsList } from '@/utils/b3Product/b3Product';
import { snackbar } from '@/utils/b3Tip';

import { getAllModifierDefaultValue } from '../../../utils/b3Product/shared/config';

import QuickAdd from './QuickAdd';
import SearchProduct from './SearchProduct';

interface AddToListProps {
  updateList: () => void;
  shoppingListId: number;
  isB2BUser: boolean;
}

export default function AddToShoppingList({
  updateList,
  isB2BUser,
  shoppingListId,
}: AddToListProps) {
  const companyStatus = useAppSelector(({ company }) => company.companyInfo.status);
  const b3Lang = useB3Lang();

  const [isOpenBulkLoadCSV, setIsOpenBulkLoadCSV] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [blockPendingAccountViewPrice] = useBlockPendingAccountViewPrice();

  const addItemsToShoppingList = isB2BUser ? addProductToShoppingList : addProductToBcShoppingList;

  const addToList = async (products: CustomFieldItems[]) => {
    try {
      if (!dispatchEvent('on-add-to-shopping-list', products)) {
        throw new Error();
      }

      const items = products.map((product) => {
        const newOptionLists = getValidOptionsList(product.newSelectOptionList, product);
        return {
          optionList: newOptionLists,
          productId: product.id,
          quantity: product.quantity,
          variantId: product.variantId,
        };
      });

      await addItemsToShoppingList({
        shoppingListId,
        items,
      });

      snackbar.success(b3Lang('shoppingList.addToShoppingList.productsAdded'));
    } catch (e: any) {
      if (e.message.length > 0) {
        snackbar.error(e.message);
      }
    }
  };

  const quickAddToList = async (products: CustomFieldItems[]) => {
    const items = products.map((product) => {
      const newOptionLists = getValidOptionsList(
        product.newSelectOptionList || product.optionList,
        product?.products || product,
      );
      return {
        optionList: newOptionLists || [],
        productId: parseInt(product.productId, 10) || 0,
        quantity: product.quantity,
        variantId: parseInt(product.variantId, 10) || 0,
      };
    });

    await addItemsToShoppingList({
      shoppingListId,
      items,
    });

    snackbar.success(b3Lang('shoppingList.addToShoppingList.productsAdded'));
  };

  const getValidProducts = (products: CustomFieldItems) => {
    const productItems: CustomFieldItems[] = [];

    products.forEach((item: CustomFieldItems) => {
      const { products: currentProduct, qty } = item;
      const { option, variantId, productId, modifiers } = currentProduct;

      const defaultModifiers = getAllModifierDefaultValue(modifiers);

      if (defaultModifiers.some((modifier) => !modifier.isVerified)) {
        return;
      }

      const optionsList = option.map((item: CustomFieldItems) => ({
        optionId: `attribute[${item.option_id}]`,
        optionValue: item.id.toString(),
      }));

      defaultModifiers.forEach((modifier) => {
        if (modifier.type === 'date') {
          Object.entries(modifier.defaultValue).forEach(([key, value]) => {
            optionsList.push({
              optionId: `attribute[${modifier.option_id}][${key}]`,
              optionValue: `${value}`,
            });
          });
        } else {
          optionsList.push({
            optionId: `attribute[${modifier.option_id}]`,
            optionValue: `${modifier.defaultValue}`,
          });
        }
      });

      productItems.push({
        productId: parseInt(productId, 10) || 0,
        variantId: parseInt(variantId, 10) || 0,
        quantity: Number(qty),
        optionList: optionsList,
        products: item.products,
      });
    });

    return productItems;
  };

  const handleCSVAddToList = async (productsData: CustomFieldItems) => {
    setIsLoading(true);
    try {
      const { validProduct } = productsData;

      const productItems = getValidProducts(validProduct);

      if (productItems.length > 0) {
        await quickAddToList(productItems);

        updateList();
      }

      setIsOpenBulkLoadCSV(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenUploadDiag = () => {
    if (blockPendingAccountViewPrice && companyStatus === 0) {
      snackbar.info(
        'Your business account is pending approval. This feature is currently disabled.',
      );
    } else {
      setIsOpenBulkLoadCSV(true);
    }
  };

  return (
    <Card
      sx={{
        marginBottom: '50px',
      }}
    >
      <CardContent>
        <Box>
          <Typography variant="h5">{b3Lang('shoppingList.addToShoppingList.addToList')}</Typography>
          <SearchProduct updateList={updateList} addToList={addToList} type="shoppingList" />

          <Divider />

          <QuickAdd type="shoppingList" updateList={updateList} quickAddToList={quickAddToList} />

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
              {b3Lang('shoppingList.addToShoppingList.bulkUploadCsv')}
            </CustomButton>
          </Box>

          <B3Upload
            isOpen={isOpenBulkLoadCSV}
            setIsOpen={setIsOpenBulkLoadCSV}
            handleAddToList={handleCSVAddToList}
            isLoading={isLoading}
            withModifiers
          />
        </Box>
      </CardContent>
    </Card>
  );
}
