import { useEffect, useState } from 'react';
import { UploadFile as UploadFileIcon } from '@mui/icons-material';
import { Box, Card, CardContent, Divider, Typography } from '@mui/material';

import CustomButton from '@/components/button/CustomButton';
import { B3Upload } from '@/components/upload/B3Upload';
import { CART_URL } from '@/constants';
import { useBlockPendingAccountViewPrice } from '@/hooks/useBlockPendingAccountViewPrice';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { useIsBackorderValidationEnabled } from '@/hooks/useIsBackorderValidationEnabled';
import { useMobile } from '@/hooks/useMobile';
import { useB3Lang } from '@/lib/lang';
import { validateProducts } from '@/shared/service/b2b/graphql/product';
import { useAppSelector } from '@/store';
import b2bLogger from '@/utils/b3Logger';
import { snackbar } from '@/utils/b3Tip';
import b3TriggerCartNumber from '@/utils/b3TriggerCartNumber';
import { createOrUpdateExistingCart } from '@/utils/cartUtils';

import { addCartProductToVerify } from '../utils';

import QuickAdd from './QuickAdd';
import SearchProduct from './SearchProduct';
import { ValidProductItem } from './ValidProduct';

export default function QuickOrderPad() {
  const [isMobile] = useMobile();
  const b3Lang = useB3Lang();

  const [isOpenBulkLoadCSV, setIsOpenBulkLoadCSV] = useState(false);
  const [productData, setProductData] = useState<ValidProductItem[]>([]);
  const [addBtnText, setAddBtnText] = useState<string>('Add to cart');
  const [isLoading, setIsLoading] = useState(false);
  const [blockPendingAccountViewPrice] = useBlockPendingAccountViewPrice();
  const featureFlags = useFeatureFlags();
  const backendValidationEnabled = useIsBackorderValidationEnabled();
  const passWithModifiersToProductUpload =
    featureFlags['B2B-3978.pass_with_modifiers_to_product_upload'] ?? false;

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

  const addSingleProductToCart = async (product: CustomFieldItems) => {
    const res = await createOrUpdateExistingCart([product]);

    if (res?.errors) {
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
  };

  const getValidProducts = (products: ValidProductItem[]) => {
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

  const handleAddToCart = async (productsData: {
    validProduct: ValidProductItem[];
    stockErrorFile: string;
  }) => {
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

  const handleAddCSVToCart = async (productsData: {
    validProduct: ValidProductItem[];
    stockErrorFile: string;
  }) => {
    setIsLoading(true);

    try {
      const { validProduct, stockErrorFile } = productsData;

      const productsToValidate = validProduct.map((item: CustomFieldItems) => ({
        productId: Number(item.products?.productId) || 0,
        variantId: Number(item.products?.variantId) || 0,
        quantity: Number(item.qty) || 0,
        productOptions:
          item.products?.option?.map((opt: CustomFieldItems) => ({
            optionId: opt.option_id,
            optionValue: opt.id,
          })) || [],
      }));

      const validationResult = await validateProducts({ products: productsToValidate });

      const outOfStockProducts = validationResult.products.filter(
        (product) => product.errorCode === 'OOS',
      );

      outOfStockProducts.forEach(({ product }) => {
        snackbar.warning(
          b3Lang('purchasedProducts.quickOrderPad.notEnoughStock', {
            variantSku: product.sku,
          }),
          {
            description: b3Lang('purchasedProducts.quickOrderPad.availableAmount', {
              availableAmount: product.availableToSell,
            }),
          },
        );
      });

      if (outOfStockProducts.length > 0 && stockErrorFile) {
        snackbar.error(
          b3Lang('purchasedProducts.quickOrderPad.outOfStockSku', {
            outOfStock: outOfStockProducts.map(({ product }) => product.sku).join(','),
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

      const nonPurchasableProducts = validationResult.products.filter(
        (product) => product.errorCode === 'NON_PURCHASABLE',
      );

      if (nonPurchasableProducts.length > 0) {
        snackbar.error(
          b3Lang('purchasedProducts.quickOrderPad.notPurchaseableSku', {
            notPurchaseSku: nonPurchasableProducts.map(({ product }) => product.sku).join(','),
          }),
        );
      }

      const otherErrorProducts = validationResult.products.filter(
        (product) => product.errorCode === 'OTHER',
      );

      if (otherErrorProducts.length > 0) {
        otherErrorProducts.forEach(({ product }) => {
          snackbar.error(
            b3Lang('purchasedProducts.quickOrderPad.otherError', {
              sku: product.sku,
            }),
          );
        });
      }

      const validProductMap = validProduct.reduce<Record<string, ValidProductItem>>((acc, item) => {
        acc[item.products.variantSku.toUpperCase()] = item;

        return acc;
      }, {});

      const cartLineItems = validationResult.products
        .filter((product) => product.responseType === 'SUCCESS')
        .map((product) => {
          const validProduct = validProductMap[product.product.sku.toUpperCase()];

          if (!validProduct) {
            return null;
          }

          return {
            productId: Number(validProduct.products.productId) || 0,
            variantId: Number(validProduct.products.variantId) || 0,
            quantity: Number(validProduct.qty) || 0,
            optionSelections:
              validProduct.products.option.map((opt: CustomFieldItems) => ({
                optionId: opt.option_id,
                optionValue: opt.id,
              })) || [],
            allOptions: validProduct.products.modifiers || [],
          };
        })
        .filter((item) => item !== null);

      if (cartLineItems.length > 0) {
        const res = await createOrUpdateExistingCart(cartLineItems);

        getSnackbarMessage(res);
        b3TriggerCartNumber();
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
    if (productData.length > 0) {
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
          <Typography sx={{ marginBottom: '1rem' }} variant="h5">
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
            <CustomButton onClick={() => handleOpenUploadDiag()} variant="text">
              <UploadFileIcon sx={{ marginRight: '8px' }} />
              {b3Lang('purchasedProducts.quickOrderPad.bulkUploadCSV')}
            </CustomButton>
          </Box>
        </Box>
      </CardContent>

      <B3Upload
        addBtnText={addBtnText}
        handleAddToList={backendValidationEnabled ? handleAddCSVToCart : handleAddToCart}
        isLoading={isLoading}
        isOpen={isOpenBulkLoadCSV}
        isToCart
        setIsOpen={setIsOpenBulkLoadCSV}
        setProductData={setProductData}
        withModifiers={passWithModifiersToProductUpload}
      />
    </Card>
  );
}
