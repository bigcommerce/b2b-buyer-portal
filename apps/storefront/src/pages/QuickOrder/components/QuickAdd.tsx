import { Fragment, KeyboardEventHandler, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Box, Grid, Typography } from '@mui/material';

import CustomButton from '@/components/button/CustomButton';
import { B3ControlTextField } from '@/components/form/B3ControlTextField';
import B3Spin from '@/components/spin/B3Spin';
import { CART_URL } from '@/constants';
import { useBlockPendingAccountViewPrice } from '@/hooks/useBlockPendingAccountViewPrice';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { useB3Lang } from '@/lib/lang';
import { getVariantInfoBySkus } from '@/shared/service/b2b/graphql/product';
import { useAppSelector } from '@/store';
import { snackbar } from '@/utils';
import b3TriggerCartNumber from '@/utils/b3TriggerCartNumber';
import { createOrUpdateExistingCart } from '@/utils/cartUtils';
import {
  ValidatedProductError,
  ValidatedProductWarning,
  validateProducts,
} from '@/utils/validateProducts';

import { SimpleObject } from '../../../types';
import { getCartProductInfo } from '../utils';

import {
  CatalogProduct,
  filterInputSkusForNotFoundProducts,
  mapCatalogToValidationPayload,
  mergeValidatedWithCatalog,
  parseOptionList,
} from './QuickAdd.validation';

const INITIAL_NUM_ROWS = 3;

export default function QuickAdd() {
  const b3Lang = useB3Lang();
  const buttonText = b3Lang('purchasedProducts.quickOrderPad.addProductsToCart');
  const featureFlags = useFeatureFlags();

  const companyStatus = useAppSelector(({ company }) => company.companyInfo.status);
  const [numRows, setNumRows] = useState(INITIAL_NUM_ROWS);
  const [isLoading, setIsLoading] = useState(false);

  const [blockPendingAccountViewPrice] = useBlockPendingAccountViewPrice();

  const handleAddRowsClick = () => {
    setNumRows((current) => current + INITIAL_NUM_ROWS);
  };

  const {
    control,
    handleSubmit,
    formState: { errors },
    setError,
    setValue,
  } = useForm({
    mode: 'all',
  });

  const convertFormInputToValidProducts = (formData: Record<string, string>) => {
    const skuQuantityMap: Record<string, number> = {};
    let allRowsValid = true;
    for (let index = 0; index < numRows; index += 1) {
      const sku = formData[`sku-${index}`];
      const qty = formData[`qty-${index}`];

      if (sku || qty) {
        let isValidRow = true;

        const quantity = parseInt(qty, 10);
        if (Number.isNaN(quantity)) {
          setError(`qty-${index}`, {
            type: 'manual',
            message: b3Lang('global.validate.required', {
              label: b3Lang('purchasedProducts.quickAdd.qty'),
            }),
          });
          isValidRow = false;
        } else if (quantity <= 0) {
          setError(`qty-${index}`, {
            type: 'manual',
            message: 'incorrect number',
          });
          isValidRow = false;
        }

        if (!sku) {
          setError(`sku-${index}`, {
            type: 'manual',
            message: b3Lang('global.validate.required', {
              label: b3Lang('purchasedProducts.quickAdd.sku'),
            }),
          });
          isValidRow = false;
        }

        if (isValidRow) {
          skuQuantityMap[sku] = (skuQuantityMap[sku] ?? 0) + quantity;
        } else {
          allRowsValid = false;
        }
      }
    }

    return {
      skuQuantityMap,
      allRowsValid,
      skus: Object.keys(skuQuantityMap),
    };
  };

  const getProductItems = async (
    variantInfoList: CustomFieldItems,
    skuValue: SimpleObject,
    skus: string[],
  ) => {
    const notFoundSku: string[] = [];
    const notPurchaseSku: string[] = [];
    const productItems: CustomFieldItems[] = [];
    const passSku: string[] = [];
    const notStockSku: {
      sku: string;
      stock: number;
    }[] = [];
    const orderLimitSku: {
      sku: string;
      min: number;
      max: number;
    }[] = [];

    const cartProducts = await getCartProductInfo();

    skus.forEach((sku) => {
      const variantInfo: CustomFieldItems | null = (variantInfoList || []).find(
        (variant: CustomFieldItems) => variant.variantSku.toUpperCase() === sku.toUpperCase(),
      );

      if (!variantInfo) {
        notFoundSku.push(sku);
        return;
      }

      const {
        productId,
        variantId,
        option: options,
        purchasingDisabled = '1',
        stock,
        isStock,
        maxQuantity,
        minQuantity,
        variantSku,
      } = variantInfo;

      const num =
        cartProducts.find(
          (item) =>
            item.sku === variantSku &&
            Number(item?.variantEntityId || 0) === Number(variantId || 0),
        )?.quantity || 0;

      const quantity = (skuValue[sku] as number) || 0;

      const allQuantity = (skuValue[sku] as number) + num || 0;

      if (purchasingDisabled === '1') {
        notPurchaseSku.push(sku);
        return;
      }

      if (isStock === '1' && allQuantity > Number(stock)) {
        notStockSku.push({
          sku,
          stock: Number(stock),
        });

        return;
      }

      if (
        maxQuantity !== 0 &&
        minQuantity !== 0 &&
        allQuantity > 0 &&
        (allQuantity > maxQuantity || allQuantity < minQuantity)
      ) {
        orderLimitSku.push({
          sku,
          min: allQuantity < minQuantity ? minQuantity : 0,
          max: allQuantity > maxQuantity ? maxQuantity : 0,
        });

        return;
      }

      const optionList = parseOptionList(options);

      passSku.push(sku);

      productItems.push({
        ...variantInfo,
        newSelectOptionList: optionList,
        productId: parseInt(productId, 10) || 0,
        quantity,
        variantId: parseInt(variantId, 10) || 0,
      });
    });

    return {
      notFoundSku,
      notPurchaseSku,
      notStockSku,
      productItems,
      passSku,
      orderLimitSku,
    };
  };

  const showErrors = (
    value: CustomFieldItems,
    skus: string[],
    inputType: 'sku' | 'qty',
    message: string,
  ) => {
    skus.forEach((sku) => {
      const skuFieldName = Object.keys(value).find((name) => value[name] === sku) || '';

      if (skuFieldName) {
        setError(skuFieldName.replace('sku', inputType), {
          type: 'manual',
          message,
        });
      }
    });
  };

  const clearInputValue = (value: CustomFieldItems, skus: string[]) => {
    skus.forEach((sku) => {
      const skuFieldName = Object.keys(value).find((name) => value[name] === sku) || '';

      if (skuFieldName) {
        setValue(skuFieldName, '');
        setValue(skuFieldName.replace('sku', 'qty'), '');
      }
    });
  };

  const getVariantList = async (skus: string[]) => {
    try {
      const { variantSku: variantInfoList } = await getVariantInfoBySkus(skus);

      return variantInfoList;
    } catch (error) {
      return [];
    }
  };

  const handleFrontendValidation = async (
    value: CustomFieldItems,
    variantInfoList: CustomFieldItems[],
    skuValue: SimpleObject,
    skus: string[],
  ) => {
    const { notFoundSku, notPurchaseSku, productItems, passSku, notStockSku, orderLimitSku } =
      await getProductItems(variantInfoList, skuValue, skus);

    if (notFoundSku.length > 0) {
      showErrors(value, notFoundSku, 'sku', '');
      snackbar.error(
        b3Lang('purchasedProducts.quickAdd.notFoundSku', {
          notFoundSku: notFoundSku.join(','),
        }),
      );
    }

    if (notPurchaseSku.length > 0) {
      showErrors(value, notPurchaseSku, 'sku', '');
      snackbar.error(
        b3Lang('purchasedProducts.quickAdd.notPurchaseableSku', {
          notPurchaseSku: notPurchaseSku.join(','),
        }),
      );
    }

    if (notStockSku.length > 0) {
      const stockSku = notStockSku.map((item) => item.sku);

      notStockSku.forEach((item) => {
        const { sku, stock } = item;

        showErrors(value, [sku], 'qty', `${stock} in stock`);
      });

      snackbar.error(
        b3Lang('purchasedProducts.quickAdd.insufficientStockSku', {
          stockSku: stockSku.join(','),
        }),
      );
    }

    if (orderLimitSku.length > 0) {
      orderLimitSku.forEach((item) => {
        const { min, max, sku } = item;

        const type = min === 0 ? 'Max' : 'Min';
        const limit = min === 0 ? max : min;
        showErrors(value, [sku], 'qty', `${type} is ${limit}`);

        const typeText = min === 0 ? 'maximum' : 'minimum';
        snackbar.error(
          b3Lang('purchasedProducts.quickAdd.purchaseQuantityLimitMessage', {
            typeText,
            limit,
            sku,
          }),
        );
      });
    }

    return { productItems, passSku };
  };

  const handleBackendValidation = async (
    variantInfoList: CatalogProduct[],
    skuValue: SimpleObject,
    skus: string[],
  ): Promise<{
    productItems: CustomFieldItems[];
    passSku: string[];
    notFoundSkus: string[];
    validationErrors: (ValidatedProductWarning | ValidatedProductError)[];
  }> => {
    const notFoundSkus = filterInputSkusForNotFoundProducts(skus, variantInfoList);

    if (variantInfoList.length === 0) {
      return { productItems: [], passSku: [], notFoundSkus, validationErrors: [] };
    }

    const productsToValidate = mapCatalogToValidationPayload(variantInfoList, skuValue);

    const { success, warning, error } = await validateProducts(productsToValidate);

    const validProducts = success.map((product) => product.product);

    const errors = [...warning, ...error];

    const productItems = mergeValidatedWithCatalog(validProducts, variantInfoList);

    const passSku = productItems.map((item) => item.variantSku);

    return { productItems, passSku, notFoundSkus, validationErrors: errors };
  };

  const addProductsToCart = async (products: CustomFieldItems[]) => {
    const res = await createOrUpdateExistingCart(products);

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
  };

  const handleAddToList = () => {
    if (blockPendingAccountViewPrice && companyStatus === 0) {
      snackbar.info(
        'Your business account is pending approval. This feature is currently disabled.',
      );
      return;
    }

    handleSubmit(async (formData) => {
      try {
        setIsLoading(true);
        const { skuQuantityMap, allRowsValid, skus } = convertFormInputToValidProducts(formData);

        if (!allRowsValid || skus.length <= 0) {
          return;
        }

        const variantInfoList = await getVariantList(skus);

        if (featureFlags['B2B-3318.move_stock_and_backorder_validation_to_backend']) {
          const result = await handleBackendValidation(variantInfoList, skuQuantityMap, skus);
          const { productItems, passSku, notFoundSkus, validationErrors } = result;

          validationErrors.forEach((err) => {
            if (err.status === 'error') {
              if (err.error.type === 'network') {
                snackbar.error(
                  b3Lang('quotes.productValidationFailed', {
                    productName: err.product.node?.productName || '',
                  }),
                );
              } else {
                snackbar.error(err.error.message);
              }
            } else {
              snackbar.error(err.message);
            }
          });

          if (notFoundSkus.length > 0) {
            snackbar.error(
              b3Lang('purchasedProducts.quickAdd.notFoundSku', {
                notFoundSku: notFoundSkus.join(','),
              }),
            );
          }

          if (productItems.length > 0) {
            await addProductsToCart(productItems);
            clearInputValue(formData, passSku);
          }
        } else {
          const { productItems, passSku } = await handleFrontendValidation(
            formData,
            variantInfoList,
            skuQuantityMap,
            skus,
          );

          if (productItems.length > 0) {
            await addProductsToCart(productItems);
            clearInputValue(formData, passSku);
          }
        }
      } catch (e) {
        if (e instanceof Error) {
          snackbar.error(e.message);
        }
      } finally {
        setIsLoading(false);
      }
    })();
  };

  const handleKeyDown: KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === 'Enter') {
      handleAddToList();
    }
  };

  return (
    <B3Spin isSpinning={isLoading} spinningHeight="auto">
      <Box sx={{ width: '100%' }}>
        <Grid
          container
          sx={{
            margin: '16px 0',
          }}
        >
          <Grid
            item
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Typography
              sx={{
                color: '#000',
              }}
              variant="body1"
            >
              {b3Lang('purchasedProducts.quickAdd.title')}
            </Typography>
          </Grid>
          <Grid item>
            <CustomButton
              variant="text"
              sx={{
                textTransform: 'initial',
                ml: '-8px',
              }}
              onClick={handleAddRowsClick}
            >
              {b3Lang('purchasedProducts.quickAdd.showMoreRowsButton')}
            </CustomButton>
          </Grid>
        </Grid>

        <Box
          onKeyDown={handleKeyDown}
          sx={{
            '& label': {
              zIndex: 0,
            },
          }}
        >
          <Grid container spacing={2}>
            {[...Array(numRows).keys()].map((row) => {
              return (
                <Fragment key={row}>
                  <Grid item xs={8} id="b3-customForm-id-name">
                    <B3ControlTextField
                      name={`sku-${row}`}
                      label={b3Lang('global.searchProductAddProduct.sku') || 'SKU#'}
                      required={false}
                      xs={8}
                      variant="filled"
                      size="small"
                      fieldType="text"
                      default=""
                      errors={errors}
                      control={control}
                    />
                  </Grid>
                  <Grid item xs={4} id="b3-customForm-id-name">
                    <B3ControlTextField
                      name={`qty-${row}`}
                      label={b3Lang('global.searchProductAddProduct.qty') || 'Qty'}
                      required={false}
                      xs={4}
                      variant="filled"
                      size="small"
                      fieldType="number"
                      default=""
                      allowArrow
                      min={1}
                      max={1000000}
                      errors={errors}
                      control={control}
                    />
                  </Grid>
                </Fragment>
              );
            })}
          </Grid>
        </Box>

        <CustomButton
          variant="outlined"
          fullWidth
          disabled={isLoading}
          onClick={handleAddToList}
          sx={{
            margin: '20px 0',
          }}
        >
          <B3Spin isSpinning={isLoading} tip="" size={16}>
            <Box
              sx={{
                flex: 1,
                textAlign: 'center',
              }}
            >
              {buttonText}
            </Box>
          </B3Spin>
        </CustomButton>
      </Box>
    </B3Spin>
  );
}
