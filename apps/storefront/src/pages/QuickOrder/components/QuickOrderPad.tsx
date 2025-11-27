import { useEffect, useState } from 'react';
import { UploadFile as UploadFileIcon } from '@mui/icons-material';
import { Box, Card, CardContent, Divider, Typography } from '@mui/material';

import CustomButton from '@/components/button/CustomButton';
import { B3Upload } from '@/components/upload/B3Upload';
import { CART_URL } from '@/constants';
import { useBlockPendingAccountViewPrice } from '@/hooks/useBlockPendingAccountViewPrice';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { useMobile } from '@/hooks/useMobile';
import { useB3Lang } from '@/lib/lang';
import { useAppSelector } from '@/store';
import b2bLogger from '@/utils/b3Logger';
import { snackbar } from '@/utils/b3Tip';
import b3TriggerCartNumber from '@/utils/b3TriggerCartNumber';
import { AddToCartItem, createOrUpdateExistingCart, partialAddToCart } from '@/utils/cartUtils';

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
  const featureFlags = useFeatureFlags();
  const backendValidationEnabled =
    featureFlags['B2B-3318.move_stock_and_backorder_validation_to_backend'] ?? false;
  const passWithModifiersToProductUpload =
    featureFlags['B2B-3978.pass_with_modifiers_to_product_upload'] ?? false;

  const companyStatus = useAppSelector(({ company }) => company.companyInfo.status);

  const showAddToCartSuccessMessage = () => {
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
  };

  const addSingleProductToCart = async (product: CustomFieldItems) => {
    const res = await createOrUpdateExistingCart([product]);

    if (res?.errors) {
      snackbar.error(res.errors[0].message);
    } else {
      showAddToCartSuccessMessage();
    }

    b3TriggerCartNumber();
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
        const res = await createOrUpdateExistingCart(productItems);

        if (res?.errors) {
          snackbar.error(res.errors[0].message);
        } else {
          showAddToCartSuccessMessage();
        }
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
      b3TriggerCartNumber();
    }
  };

  const handleAddCSVToCart = async (productsData: CustomFieldItems) => {
    setIsLoading(true);

    try {
      const { validProduct } = productsData as { validProduct: CustomFieldItems[] };

      // Convert products to cart format
      const productItems = validProduct.map<AddToCartItem>((item) => ({
        productId: Number(item.products?.productId) || 0,
        variantId: Number(item.products?.variantId) || 0,
        quantity: Number(item.qty) || 0,
        optionSelections:
          item.products?.option?.map((opt: CustomFieldItems) => ({
            optionId: opt.option_id,
            optionValue: opt.id,
          })) || [],
        allOptions: item.products?.modifiers || [],
        productName: item.products?.productName || '',
      }));

      const { success, warning, error } = await partialAddToCart(productItems);

      warning.forEach((err) => {
        snackbar.error(err.message);
      });

      error.forEach((err) => {
        if (err.error.type === 'network') {
          snackbar.error(
            b3Lang('quotes.productValidationFailed', {
              productName: err.product.productName || '',
            }),
          );
        } else {
          snackbar.error(err.error.message);
        }
      });

      if (success.length > 0) {
        showAddToCartSuccessMessage();
      }

      setIsOpenBulkLoadCSV(false);
    } catch (error) {
      if (error instanceof Error) {
        const errorMessage = error.message;
        const { stockErrorFile } = productsData;
        // const sanitizedMessage = sanitizeErrorMessage(errorMessage);

        const isOutOfStock =
          errorMessage.toLowerCase().includes('out of stock') ||
          errorMessage.toLowerCase().includes('insufficient stock');

        if (isOutOfStock) {
          if (stockErrorFile) {
            snackbar.error(errorMessage, {
              action: {
                label: b3Lang('purchasedProducts.quickOrderPad.downloadErrorsCSV'),
                onClick: () => {
                  window.location.href = stockErrorFile;
                },
              },
            });
          } else {
            snackbar.error(errorMessage);
          }
        } else {
          // Show other cart API errors as they come
          snackbar.error(errorMessage);
        }
      }
    } finally {
      setIsLoading(false);
      b3TriggerCartNumber();
    }
  };

  const handleQuickSearchAddCart = async (product: CustomFieldItems) => {
    const currentProduct: CustomFieldItems = {
      node: {
        ...product,
        productsSearch: product,
      },
    };

    const isPassVerify = await addCartProductToVerify([currentProduct], b3Lang);

    try {
      if (isPassVerify) {
        await addSingleProductToCart(product);
      }
    } catch (error) {
      b2bLogger.error(error);
    }
  };

  const handleOpenUploadDiag = () => {
    if (blockPendingAccountViewPrice && companyStatus === 0) {
      snackbar.info(b3Lang('purchasedProducts.quickOrderPad.addNProductsToCart'));
    } else {
      setIsOpenBulkLoadCSV(true);
    }
  };

  const handleBackendQuickSearchAddToCart = async (product: CustomFieldItems) => {
    try {
      await addSingleProductToCart(product);
    } catch (e: unknown) {
      if (e instanceof Error) {
        snackbar.error(e.message);
      }
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

          <SearchProduct
            addToList={
              backendValidationEnabled
                ? handleBackendQuickSearchAddToCart
                : handleQuickSearchAddCart
            }
          />

          <Divider />

          <QuickAdd />

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
        handleAddToList={backendValidationEnabled ? handleAddCSVToCart : handleAddToCart}
        setProductData={setProductData}
        addBtnText={addBtnText}
        isLoading={isLoading}
        isToCart
        withModifiers={passWithModifiersToProductUpload}
      />
    </Card>
  );
}
