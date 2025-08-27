import { KeyboardEventHandler, useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Box, Grid, Typography } from '@mui/material';

import { B3CustomForm } from '@/components';
import CustomButton from '@/components/button/CustomButton';
import B3Spin from '@/components/spin/B3Spin';
import { useBlockPendingAccountViewPrice } from '@/hooks';
import { useB3Lang } from '@/lib/lang';
import { getVariantInfoBySkus } from '@/shared/service/b2b';
import { useAppSelector } from '@/store';
import { snackbar } from '@/utils';
import { compareOption } from '@/utils/b3Product/b3Product';
import { getAllModifierDefaultValue, getQuickAddRowFields } from '@/utils/b3Product/shared/config';

import { ShoppingListAddProductOption, SimpleObject } from '../../../types';

interface AddToListContentProps {
  updateList: () => void;
  quickAddToList: (products: CustomFieldItems[]) => CustomFieldItems;
  level?: number;
  buttonText?: string;
  buttonLoading?: boolean;
  type?: string;
}

export default function QuickAdd(props: AddToListContentProps) {
  const b3Lang = useB3Lang();
  const {
    updateList,
    quickAddToList,
    level = 3,
    buttonText = b3Lang('shoppingList.quickAdd.addToShoppingList'),
    buttonLoading = false,
    type,
  } = props;

  const companyStatus = useAppSelector(({ company }) => company.companyInfo.status);
  const draftQuoteList = useAppSelector(({ quoteInfo }) => quoteInfo.draftQuoteList);

  const [blockPendingAccountViewPrice] = useBlockPendingAccountViewPrice();

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

  const getProductItems = useCallback(
    (variantInfoList: CustomFieldItems, skuValue: SimpleObject, skus: string[]) => {
      const notFoundSku: string[] = [];
      const notPurchaseSku: string[] = [];
      const productItems: CustomFieldItems[] = [];
      const passSku: string[] = [];
      const notAddAble: string[] = [];
      const numberLimit: string[] = [];

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
          modifiers,
          variantSku,
        } = variantInfo;
        const defaultModifiers = getAllModifierDefaultValue(modifiers);

        const quantity = (skuValue[sku] as number) || 0;

        if (purchasingDisabled === '1' && type !== 'shoppingList') {
          notPurchaseSku.push(sku);
          return;
        }

        const notPassedModifier = defaultModifiers.filter(
          (modifier: CustomFieldItems) => !modifier.isVerified,
        );
        if (notPassedModifier.length > 0) {
          notAddAble.push(sku);

          return;
        }

        if (Number(quantity) < 1 || Number(quantity) > 1000000) {
          numberLimit.push(sku);
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

        defaultModifiers.forEach((modifier: CustomFieldItems) => {
          const { type } = modifier;

          if (type === 'date') {
            const { defaultValue } = modifier;
            Object.keys(defaultValue).forEach((key) => {
              optionList.push({
                optionId: `attribute[${modifier.option_id}][${key}]`,
                optionValue: `${modifier.defaultValue[key]}`,
              });
            });
          } else {
            optionList.push({
              optionId: `attribute[${modifier.option_id}]`,
              optionValue: `${modifier.defaultValue}`,
            });
          }
        });

        passSku.push(sku);

        const quoteDraftItem = draftQuoteList.find((item) => item.node.variantSku === variantSku);
        if (quoteDraftItem) {
          const oldOptionList = JSON.parse(quoteDraftItem.node.optionList);
          let { quantity: quoteDraftItemQuantity } = quoteDraftItem.node;

          const isAdd =
            oldOptionList.length > optionList.length
              ? compareOption(oldOptionList, optionList)
              : compareOption(optionList, oldOptionList);

          if (isAdd) {
            quoteDraftItemQuantity += quantity;
          }
          if (quoteDraftItemQuantity > 1000000) {
            numberLimit.push(sku);
            return;
          }
        }

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
        productItems,
        passSku,
        notAddAble,
        numberLimit,
      };
    },
    [draftQuoteList, type],
  );

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
        const { notFoundSku, notPurchaseSku, productItems, notAddAble, passSku, numberLimit } =
          getProductItems(variantInfoList, skuValue, skus);

        if (notFoundSku.length > 0) {
          showErrors(value, notFoundSku, 'sku', '');
          snackbar.error(
            b3Lang('shoppingList.quickAdd.skuNotFound', {
              notFoundSku: notFoundSku.join(', '),
            }),
          );
        }

        if (notPurchaseSku.length > 0) {
          showErrors(value, notPurchaseSku, 'sku', '');
          snackbar.error(
            b3Lang('shoppingList.quickAdd.skuNotPurchasable', {
              notPurchaseSku: notPurchaseSku.join(', '),
            }),
          );
        }

        if (notAddAble.length > 0) {
          showErrors(value, notAddAble, 'sku', '');
          snackbar.error(
            b3Lang('shoppingList.quickAdd.skuNotAddable', {
              notAddAble: notAddAble.join(', '),
            }),
          );
        }

        if (numberLimit.length > 0) {
          numberLimit.forEach((sku) => {
            showErrors(value, [sku], 'qty', '');
          });

          snackbar.error(
            b3Lang('shoppingList.quickAdd.skuLimitQuantity', {
              numberLimit: numberLimit.join(', '),
            }),
          );
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
              {b3Lang('shoppingList.quickAdd.quickAdd')}
            </Typography>
          </Grid>
          <Grid item>
            <CustomButton
              variant="text"
              sx={{
                textTransform: 'initial',
                ml: '-8px',
                fontWeight: '400',
              }}
              onClick={handleAddRowsClick}
            >
              {b3Lang('shoppingList.quickAdd.showMoreRows')}
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
          <B3Spin isSpinning={buttonLoading ? isLoading : false} tip="" size={16}>
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
