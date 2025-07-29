import { useEffect, useState } from 'react';
import { useB3Lang } from '@b3/lang';
import { UploadFile as UploadFileIcon } from '@mui/icons-material';
import { Box, Card, CardContent, Divider, Typography } from '@mui/material';

import { B3Upload } from '@/components';
import CustomButton from '@/components/button/CustomButton';
import { CART_URL } from '@/constants';
import { useBlockPendingAccountViewPrice } from '@/hooks';
import useMobile from '@/hooks/useMobile';
import { useAppSelector } from '@/store';
import { snackbar } from '@/utils';
import b2bLogger from '@/utils/b3Logger';
import b3TriggerCartNumber from '@/utils/b3TriggerCartNumber';
import { callCart } from '@/utils/cartUtils';

import { addCartProductToVerify } from '../utils';

import QuickAdd from './QuickAdd';
import SearchProduct from './SearchProduct';

export default function QuickOrderPad() {
  const [isMobile] = useMobile();
  const b3Lang = useB3Lang();

  const [isOpenBulkLoadCSV, setIsOpenBulkLoadCSV] = useState(false);
  const [productData, setProductData] = useState<CustomFieldItems>([]);
  const [addBtnText, setAddBtnText] = useState<string>('Add to cart');
  const [isLoading, setIsLoading] = useState(false);
  const [blockPendingAccountViewPrice] = useBlockPendingAccountViewPrice();

  const companyStatus = useAppSelector(({ company }) => company.companyInfo.status);

  const getSnackbarMessage = (res: any) => {
    if (res && !res.errors) {
      snackbar.success(b3Lang('purchasedProducts.quickOrderPad.productsAdded'), {
        action: {
          label: b3Lang('purchasedProducts.quickOrderPad.viewCart'),
          onClick: () => {
            if (window.b2b.callbacks.dispatchEvent('on-click-cart-button')) {
              window.location.href = CART_URL;
            }
          },
        },
      });
    } else {
      snackbar.error('Error has occurred');
    }
  };

  const quickAddToList = async (products: CustomFieldItems[]) => {
    const res = await callCart(products);

    if (res && res.errors) {
      snackbar.error(res.errors[0].message);
    } else {
      snackbar.success(b3Lang('purchasedProducts.quickOrderPad.productsAdded'), {
        action: {
          label: b3Lang('purchasedProducts.quickOrderPad.viewCart'),
          onClick: () => {
            if (window.b2b.callbacks.dispatchEvent('on-click-cart-button')) {
              window.location.href = CART_URL;
            }
          },
        },
      });
    }

    b3TriggerCartNumber();

    return res;
  };

  const getValidProducts = (products: CustomFieldItems) => {
    const notPurchaseSku: string[] = [];
    const productItems: CustomFieldItems[] = [];
    const limitProduct: CustomFieldItems[] = [];
    const minLimitQuantity: CustomFieldItems[] = [];
    const maxLimitQuantity: CustomFieldItems[] = [];
    const outOfStock: string[] = [];

    products.forEach((item: CustomFieldItems) => {
      const { products: currentProduct, qty } = item;
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
        modifiers,
      } = currentProduct;
      if (purchasingDisabled === '1' || purchasingDisabled) {
        notPurchaseSku.push(variantSku);
        return;
      }

      if (isStock === '1' && stock === 0) {
        outOfStock.push(variantSku);
        return;
      }

      if (isStock === '1' && stock > 0 && stock < Number(qty)) {
        limitProduct.push({
          variantSku,
          AvailableAmount: stock,
        });
        return;
      }

      if (Number(minQuantity) > 0 && Number(qty) < Number(minQuantity)) {
        minLimitQuantity.push({
          variantSku,
          minQuantity,
        });

        return;
      }

      if (Number(maxQuantity) > 0 && Number(qty) > Number(maxQuantity)) {
        maxLimitQuantity.push({
          variantSku,
          maxQuantity,
        });

        return;
      }

      const optionsList = option.map((item: CustomFieldItems) => ({
        optionId: item.option_id,
        optionValue: item.id,
      }));

      productItems.push({
        productId: parseInt(productId, 10) || 0,
        variantId: parseInt(variantId, 10) || 0,
        quantity: Number(qty),
        optionSelections: optionsList,
        allOptions: modifiers,
      });
    });

    return {
      notPurchaseSku,
      productItems,
      limitProduct,
      minLimitQuantity,
      maxLimitQuantity,
      outOfStock,
    };
  };

  const handleAddToCart = async (productsData: CustomFieldItems) => {
    setIsLoading(true);
    try {
      const { stockErrorFile, validProduct } = productsData;

      const {
        notPurchaseSku,
        productItems,
        limitProduct,
        minLimitQuantity,
        maxLimitQuantity,
        outOfStock,
      } = getValidProducts(validProduct);

      if (productItems.length > 0) {
        const res = await callCart(productItems);

        getSnackbarMessage(res);
        b3TriggerCartNumber();
      }

      if (limitProduct.length > 0) {
        limitProduct.forEach((data: CustomFieldItems) => {
          snackbar.warning(
            b3Lang('purchasedProducts.quickOrderPad.notEnoughStock', {
              variantSku: data.variantSku,
            }),
            {
              description: b3Lang('purchasedProducts.quickOrderPad.availableAmount', {
                availableAmount: data.AvailableAmount,
              }),
            },
          );
        });
      }

      if (notPurchaseSku.length > 0) {
        snackbar.error(
          b3Lang('purchasedProducts.quickOrderPad.notPurchaseableSku', {
            notPurchaseSku: notPurchaseSku.join(','),
          }),
        );
      }

      if (outOfStock.length > 0 && stockErrorFile) {
        snackbar.error(
          b3Lang('purchasedProducts.quickOrderPad.outOfStockSku', {
            outOfStock: outOfStock.join(','),
          }),
          {
            action: {
              label: b3Lang('purchasedProducts.quickOrderPad.downloadErrorsCSV'),
              onClick: () => {
                window.location.href = stockErrorFile;
              },
            },
          },
        );
      }

      if (minLimitQuantity.length > 0) {
        minLimitQuantity.forEach((data: CustomFieldItems) => {
          snackbar.error(
            b3Lang('purchasedProducts.quickOrderPad.minQuantityMessage', {
              minQuantity: data.minQuantity,
              sku: data.variantSku,
            }),
          );
        });
      }

      if (maxLimitQuantity.length > 0) {
        maxLimitQuantity.forEach((data: CustomFieldItems) => {
          snackbar.error(
            b3Lang('purchasedProducts.quickOrderPad.maxQuantityMessage', {
              maxQuantity: data.maxQuantity,
              sku: data.variantSku,
            }),
          );
        });
      }

      setIsOpenBulkLoadCSV(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSearchAddCart = async (productData: CustomFieldItems[]) => {
    const currentProducts = productData.map((item) => {
      return {
        node: {
          ...item,
          productsSearch: item,
        },
      };
    });
    const isPassVerify = await addCartProductToVerify(
      currentProducts as CustomFieldItems[],
      b3Lang,
    );
    try {
      if (isPassVerify) {
        await quickAddToList(productData);
      }
    } catch (error) {
      b2bLogger.error(error);
    }

    return productData;
  };

  const handleOpenUploadDiag = () => {
    if (blockPendingAccountViewPrice && companyStatus === 0) {
      snackbar.info(b3Lang('purchasedProducts.quickOrderPad.addNProductsToCart'));
    } else {
      setIsOpenBulkLoadCSV(true);
    }
  };

  useEffect(() => {
    if (productData?.length > 0) {
      setAddBtnText(
        b3Lang('purchasedProducts.quickOrderPad.addNProductsToCart', {
          quantity: productData.length,
        }),
      );
    }
  }, [b3Lang, productData]);

  return (
    <Card sx={{ marginBottom: isMobile ? '8.5rem' : '50px' }}>
      <CardContent>
        <Box>
          <Typography variant="h5" sx={{ marginBottom: '1rem' }}>
            {b3Lang('purchasedProducts.quickOrderPad.quickOrderPad')}
          </Typography>

          <SearchProduct addToList={handleQuickSearchAddCart} />

          <Divider />

          <QuickAdd quickAddToList={quickAddToList} />

          <Divider />

          <Box sx={{ margin: '20px 0 0' }}>
            <CustomButton variant="text" onClick={() => handleOpenUploadDiag()}>
              <UploadFileIcon sx={{ marginRight: '8px' }} />
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
  );
}
