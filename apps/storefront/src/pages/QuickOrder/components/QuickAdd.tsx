import { KeyboardEventHandler, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useB3Lang } from '@b3/lang';
import { Box, Grid, Typography } from '@mui/material';

import { B3CustomForm } from '@/components';
import CustomButton from '@/components/button/CustomButton';
import B3Spin from '@/components/spin/B3Spin';
import { useBlockPendingAccountViewPrice } from '@/hooks';
import { isB2BUserSelector, useAppSelector } from '@/store';
import { snackbar } from '@/utils';
import { getQuickAddRowFields } from '@/utils/b3Product/shared/config';

import { getB2BVariantInfoBySkus, getBcVariantInfoBySkus } from '../../../shared/service/b2b';
import { ShoppingListAddProductOption, SimpleObject } from '../../../types';
import { getCartProductInfo } from '../utils';

interface AddToListContentProps {
  updateList?: () => void;
  quickAddToList: (products: CustomFieldItems[]) => CustomFieldItems;
  level?: number;
  buttonText?: string;
}

export default function QuickAdd(props: AddToListContentProps) {
  const b3Lang = useB3Lang();
  const {
    updateList = () => {},
    quickAddToList,
    level = 3,
    buttonText = b3Lang('purchasedProducts.quickAdd.addProductToList'),
  } = props;

  const isB2BUser = useAppSelector(isB2BUserSelector);
  const companyStatus = useAppSelector(({ company }) => company.companyInfo.status);
  const [rows, setRows] = useState(level);
  const [formFields, setFormFields] = useState<CustomFieldItems[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loopRows = (rows: number, fn: (index: number) => void) => {
    new Array(rows).fill(1).forEach((_, index) => fn(index));
  };

  useEffect(() => {
    let formFields: CustomFieldItems[] = [];
    loopRows(rows, (index) => {
      formFields = [...formFields, ...getQuickAddRowFields(index, b3Lang)];
    });
    setFormFields(formFields);
    // disabling since b3Lang since it has rendering issues
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  const [blockPendingAccountViewPrice] = useBlockPendingAccountViewPrice();

  const handleAddRowsClick = () => {
    setRows(rows + level);
  };

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors },
    setError,
    setValue,
  } = useForm({
    mode: 'all',
  });

  const validateSkuInput = (index: number, sku: string, qty: string) => {
    if (!sku && !qty) {
      return true;
    }

    let isValid = true;
    const quantity = parseInt(qty, 10) || 0;

    if (!sku) {
      setError(`sku-${index}`, {
        type: 'manual',
        message: b3Lang('global.validate.required', {
          label: b3Lang('purchasedProducts.quickAdd.sku'),
        }),
      });
      isValid = false;
    }

    if (!qty) {
      setError(`qty-${index}`, {
        type: 'manual',
        message: b3Lang('global.validate.required', {
          label: b3Lang('purchasedProducts.quickAdd.qty'),
        }),
      });
      isValid = false;
    } else if (quantity <= 0) {
      setError(`qty-${index}`, {
        type: 'manual',
        message: 'incorrect number',
      });
      isValid = false;
    }

    return isValid;
  };

  const getProductData = (value: CustomFieldItems) => {
    const skuValue: SimpleObject = {};
    let isValid = true;
    loopRows(rows, (index) => {
      const sku = value[`sku-${index}`];
      const qty = value[`qty-${index}`];

      isValid = validateSkuInput(index, sku, qty) === false ? false : isValid;

      if (isValid && sku) {
        const quantity = parseInt(qty, 10) || 0;
        skuValue[sku] = skuValue[sku] ? (skuValue[sku] as number) + quantity : quantity;
      }
    });

    return {
      skuValue,
      isValid,
      skus: Object.keys(skuValue),
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

      if (isStock === '1' && quantity > Number(stock)) {
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

      const optionList = (options || []).reduce(
        (arr: ShoppingListAddProductOption[], optionStr: string) => {
          try {
            const option = typeof optionStr === 'string' ? JSON.parse(optionStr) : optionStr;
            arr.push({
              optionId: `attribute[${option.option_id}]`,
              optionValue: `${option.id}`,
            });
            return arr;
          } catch (error) {
            return arr;
          }
        },
        [],
      );

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
    const getVariantInfoBySku = isB2BUser ? getB2BVariantInfoBySkus : getBcVariantInfoBySkus;
    try {
      const { variantSku: variantInfoList } = await getVariantInfoBySku(
        {
          skus,
        },
        true,
      );

      return variantInfoList;
    } catch (error) {
      return [];
    }
  };

  const handleAddToList = () => {
    if (blockPendingAccountViewPrice && companyStatus === 0) {
      snackbar.info(
        'Your business account is pending approval. This feature is currently disabled.',
      );
      return;
    }

    handleSubmit(async (value) => {
      try {
        setIsLoading(true);
        const { skuValue, isValid, skus } = getProductData(value);

        if (!isValid || skus.length <= 0) {
          return;
        }

        const variantInfoList = await getVariantList(skus);

        const { notFoundSku, notPurchaseSku, productItems, passSku, notStockSku, orderLimitSku } =
          await getProductItems(variantInfoList, skuValue, skus);

        if (notFoundSku.length > 0) {
          showErrors(value, notFoundSku, 'sku', '');
          snackbar.error(
            b3Lang('purchasedProducts.quickAdd.notFoundSku', {
              notFoundSku: notFoundSku.join(','),
            }),
            {
              isClose: true,
            },
          );
        }

        if (notPurchaseSku.length > 0) {
          showErrors(value, notPurchaseSku, 'sku', '');
          snackbar.error(
            b3Lang('purchasedProducts.quickAdd.notPurchaseableSku', {
              notPurchaseSku: notPurchaseSku.join(','),
            }),
            {
              isClose: true,
            },
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
            {
              isClose: true,
            },
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
              {
                isClose: true,
              },
            );
          });
        }

        if (productItems.length > 0) {
          await quickAddToList(productItems);
          clearInputValue(value, passSku);

          updateList();
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
          <B3CustomForm
            formFields={formFields}
            errors={errors}
            control={control}
            getValues={getValues}
            setValue={setValue}
          />
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
