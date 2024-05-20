import {
  ChangeEvent,
  Dispatch,
  KeyboardEvent,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { FieldValues, useForm } from 'react-hook-form';
import { useB3Lang } from '@b3/lang';
import styled from '@emotion/styled';
import { Box, Divider, TextField, Typography } from '@mui/material';
import isEqual from 'lodash-es/isEqual';

import { B3CustomForm } from '@/components';
import B3Dialog from '@/components/B3Dialog';
import B3Sping from '@/components/spin/B3Sping';
import { PRODUCT_DEFAULT_IMAGE } from '@/constants';
import { searchB2BProducts, searchBcProducts } from '@/shared/service/b2b';
import { useAppSelector } from '@/store';
import { currencyFormat, snackbar } from '@/utils';
import b2bLogger from '@/utils/b3Logger';
import {
  calculateProductListPrice,
  getBCPrice,
  getProductInfoDisplayPrice,
  getVariantInfoDisplayPrice,
} from '@/utils/b3Product/b3Product';

import { AllOptionProps, ShoppingListProductItem, SimpleObject, Variant } from '../../../types';
import {
  Base64,
  getOptionRequestData,
  getProductOptionsFields,
} from '../../../utils/b3Product/shared/config';

const Flex = styled('div')({
  display: 'flex',
  wordBreak: 'break-word',
  gap: '8px',
  flexWrap: 'wrap',
  padding: '12px 0 12px',
  '&:first-of-type': {
    marginTop: '12px',
  },
});

interface FlexItemProps {
  padding?: string;
}

const FlexItem = styled('div')(({ padding }: FlexItemProps) => ({
  display: 'flex',
  flexGrow: 1,
  flexShrink: 1,
  alignItems: 'flex-start',
  width: '100%',
  padding: padding || '0 0 0 16px',
}));

const ProductImage = styled('img')(() => ({
  width: '60px',
  height: '60px',
  borderRadius: '4px',
  marginTop: '12px',
  flexShrink: 0,
}));

const ProductOptionText = styled('div')(() => ({
  fontSize: '0.75rem',
  lineHeight: '1.5',
  color: '#455A64',
}));

const StyleTextField = styled(TextField)(() => ({
  '& input::-webkit-outer-spin-button, input::-webkit-inner-spin-button': {
    marginTop: '-8px',
    marginBottom: '8px',
  },
}));

interface ChooseOptionsDialogProps {
  isOpen: boolean;
  product?: ShoppingListProductItem;
  onCancel: () => void;
  onConfirm: (products: CustomFieldItems[]) => void;
  isEdit?: boolean;
  isLoading: boolean;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  addButtonText?: string;
  isB2BUser: boolean;
  type?: string;
}

interface ChooseOptionsProductProps extends ShoppingListProductItem {
  newSelectOptionList: {
    optionId: string;
    optionValue: any;
  }[];
  productId: number;
  quantity: number;
  variantId: number;
  additionalProducts: CustomFieldItems;
}

export default function ChooseOptionsDialog(props: ChooseOptionsDialogProps) {
  const {
    isOpen,
    onCancel,
    onConfirm,
    product,
    isEdit = false,
    isLoading,
    setIsLoading,
    isB2BUser,
    type,
    ...restProps
  } = props;

  const b3Lang = useB3Lang();
  const { addButtonText = b3Lang('shoppingList.chooseOptionsDialog.addToList') } = restProps;

  const showInclusiveTaxPrice = useAppSelector(({ global }) => global.showInclusiveTaxPrice);
  const isEnableProduct = useAppSelector(
    ({ global }) => global.blockPendingQuoteNonPurchasableOOS.isEnableProduct,
  );
  const salesRepCompanyId = useAppSelector(({ b2bFeatures }) => b2bFeatures.masqueradeCompany.id);
  const customerGroupId = useAppSelector((state) => state.company.customer.customerGroupId);
  const companyInfoId = useAppSelector((state) => state.company.companyInfo.id);
  const [quantity, setQuantity] = useState<number | string>(1);
  const [formFields, setFormFields] = useState<CustomFieldItems[]>([]);
  const [variantInfo, setVariantInfo] = useState<Partial<Variant> | null>(null);
  const [variantSku, setVariantSku] = useState('');
  const [isShowPrice, setShowPrice] = useState<boolean>(true);
  const [additionalProducts, setAdditionalProducts] = useState<CustomFieldItems>({});
  const [productPriceChangeOptions, setProductPriceChangeOptions] = useState<
    Partial<AllOptionProps>[]
  >([]);
  const [newPrice, setNewPrice] = useState<number>(0);
  const [chooseOptionsProduct, setChooseOptionsProduct] = useState<ChooseOptionsProductProps[]>([]);
  const [isRequestLoading, setIsRequestLoading] = useState<boolean>(false);

  useEffect(() => {
    if (type === 'quote' && product) {
      if (variantSku) {
        const newProduct = product as CustomFieldItems;
        newProduct.quantity = quantity;
        const isPrice = !!getVariantInfoDisplayPrice(newProduct.base_price, newProduct, {
          sku: variantSku,
        });
        setShowPrice(isPrice);
      } else {
        const newProduct = product as CustomFieldItems;
        newProduct.quantity = quantity;
        const isPrice = !!getProductInfoDisplayPrice(newProduct.base_price, newProduct);
        if (!isPrice) {
          setShowPrice(false);
        }
      }
    } else if ((type === 'shoppingList' || type === 'quickOrder') && product) {
      setShowPrice(!product?.isPriceHidden);
    }
  }, [variantSku, quantity, product, type]);

  const setChooseOptionsForm = async (product: ShoppingListProductItem) => {
    try {
      setIsLoading(true);

      const modifiers =
        product?.modifiers?.filter(
          (modifier) =>
            modifier.type === 'product_list_with_images' || modifier.type === 'product_list',
        ) || [];
      const productImages: SimpleObject = {};
      const additionalProductsParams: CustomFieldItems = {};
      if (modifiers.length > 0) {
        const productIds = modifiers.reduce((arr: number[], modifier) => {
          const { option_values: optionValues } = modifier;
          optionValues.forEach((option) => {
            if (option?.value_data?.product_id) {
              arr.push(option.value_data.product_id);
            }
          });
          return arr;
        }, []);

        if (productIds.length > 0) {
          const getProducts = isB2BUser ? searchB2BProducts : searchBcProducts;

          const companyId = companyInfoId || salesRepCompanyId;
          const { productsSearch }: CustomFieldItems = await getProducts({
            productIds,
            companyId,
            customerGroupId,
          });

          productsSearch.forEach((product: CustomFieldItems) => {
            productImages[product.id] = product.imageUrl;
            additionalProductsParams[product.id] = product;
          });
        }
      }

      setAdditionalProducts(additionalProductsParams);

      setQuantity(product.quantity);
      if (product.variants?.length === 1 && product.variants[0]) {
        setVariantInfo(product.variants[0]);
      }

      const productOptionsFields = getProductOptionsFields(product, productImages);
      setFormFields([...productOptionsFields]);
    } finally {
      setIsLoading(false);
    }
  };

  const getProductPriceOptions = (product: ShoppingListProductItem) => {
    const newProductPriceChangeOptionLists: Partial<AllOptionProps>[] = [];
    product.allOptions?.forEach((item) => {
      if (
        item.type === 'product_list_with_images' ||
        item.type === 'product_list' ||
        item.type === 'checkbox' ||
        item.type === 'rectangles' ||
        item.type === 'swatch' ||
        item.type === 'radio_buttons' ||
        item.type === 'dropdown'
      ) {
        newProductPriceChangeOptionLists.push(item);
      }
    });

    setProductPriceChangeOptions(newProductPriceChangeOptionLists);
  };

  useEffect(() => {
    if (product) {
      setChooseOptionsForm(product);
      setChooseOptionsProduct([]);
      setNewPrice(0);
      if (product?.allOptions?.length) {
        getProductPriceOptions(product);
      }
    } else {
      setQuantity(1);
      setFormFields([]);
    }
    // disabling as we don't need dispatchers here
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product]);

  const getProductPrice = (product: ShoppingListProductItem) => {
    const { variants = [] } = product;

    let priceNumber = 0;
    if (variantSku) {
      const variantCalculatePrice = variants.find(
        (variant) => variant.sku === variantSku,
      )?.bc_calculated_price;
      priceNumber =
        (showInclusiveTaxPrice
          ? variantCalculatePrice?.tax_inclusive
          : variantCalculatePrice?.tax_exclusive) || 0;
    } else {
      const variantCalculatePrice = variants[0]?.bc_calculated_price;
      priceNumber =
        parseFloat(
          (showInclusiveTaxPrice
            ? variantCalculatePrice?.tax_inclusive
            : variantCalculatePrice?.tax_exclusive
          )?.toString(),
        ) || 0;
    }

    return priceNumber;
  };

  const handleProductQuantityChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value || parseInt(e.target.value, 10) > 0) {
      setQuantity(e.target.value);
    }
  };

  const handleNumberInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (['KeyE', 'Equal', 'Minus'].indexOf(event.code) > -1) {
      event.preventDefault();
    }
  };

  const handleNumberInputBlur = () => {
    if (!quantity) {
      setQuantity(1);
    }

    if (+quantity > 1000000) {
      setQuantity(1000000);
    }
  };

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm({
    mode: 'all',
  });

  const formValues = watch();
  const cache = useRef(formValues);

  const getProductVariantId = useCallback(
    async (value: CustomFieldItems, changeName = '') => {
      const isVariantOptionChange =
        formFields.find((item: CustomFieldItems) => item.name === changeName)?.isVariantOption ||
        false;

      if (!isVariantOptionChange || !product || !changeName) {
        return;
      }

      const { variants = [] } = product || {};

      const variantInfo =
        variants.find((variant) => {
          const { option_values: optionValues = [] } = variant;

          const isSelectVariant = optionValues.reduce((isSelect, option) => {
            if (
              value[Base64.encode(`attribute[${option.option_id}]`)].toString() !==
              (option.id || '').toString()
            ) {
              return false;
            }
            return isSelect;
          }, true);

          return isSelectVariant;
        }) || null;

      setVariantSku(variantInfo ? variantInfo.sku : '');
      setVariantInfo(variantInfo);
    },
    [formFields, product],
  );

  useEffect(() => {
    const subscription = watch((value, { name }) => {
      getProductVariantId(value, name);
    });

    if (formFields[0]) {
      const defaultValues: SimpleObject = formFields.reduce((value: SimpleObject, fields) => {
        const formFieldValue = value;
        formFieldValue[fields.name] = fields.default;
        setValue(fields.name, fields.default);
        return value;
      }, {});
      getProductVariantId(defaultValues, formFields[0].name);
    }

    return () => subscription.unsubscribe();
    // disabling as we don't need dispatchers or subscribers in the dep array
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formFields, getProductVariantId]);

  const validateQuantityNumber = useCallback(() => {
    const { purchasing_disabled: purchasingDisabled = true } = variantInfo || {};

    if (type !== 'shoppingList' && purchasingDisabled === true && !isEnableProduct) {
      snackbar.error(b3Lang('shoppingList.chooseOptionsDialog.productNoLongerForSale'));
      return false;
    }

    return true;
    // disabling as b3Lang will render errors
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEnableProduct, type, variantInfo]);

  const getOptionList = useCallback(
    (value: FieldValues) => {
      const optionsData = getOptionRequestData(formFields, {}, value);
      return Object.keys(optionsData).map((optionId) => ({
        optionId,
        optionValue: optionsData[optionId]?.toString(),
      }));
    },
    [formFields],
  );

  useEffect(() => {
    if (cache?.current && isEqual(cache?.current, formValues)) {
      return;
    }

    cache.current = formValues;
    if (Object.keys(formValues).length && formFields.length && productPriceChangeOptions.length) {
      const optionList = getOptionList(formValues);
      const { variant_id: variantId = '' } = variantInfo || {};
      if (!product || !product.id || !variantId || !validateQuantityNumber()) {
        return;
      }

      const newChooseOptionsProduct = [
        {
          ...product,
          newSelectOptionList: optionList,
          productId: product?.id,
          quantity: parseInt(quantity.toString(), 10) || 1,
          variantId: parseInt(variantId.toString(), 10) || 1,
          additionalProducts,
        },
      ];

      if (chooseOptionsProduct[0]) {
        let optionChangeFlag = false;
        const { newSelectOptionList } = chooseOptionsProduct[0];
        newSelectOptionList.forEach((option) => {
          const findAttributeId = productPriceChangeOptions.findIndex((item) =>
            option.optionId.includes(String(item.id)),
          );
          optionList.forEach((newOption) => {
            if (
              option.optionId === newOption.optionId &&
              option.optionValue !== newOption.optionValue &&
              findAttributeId !== -1
            ) {
              optionChangeFlag = true;
            }
          });
        });
        if (optionChangeFlag) {
          setChooseOptionsProduct(newChooseOptionsProduct);
        }
      } else {
        setChooseOptionsProduct(newChooseOptionsProduct);
      }
    }
  }, [
    additionalProducts,
    chooseOptionsProduct,
    formFields.length,
    formValues,
    getOptionList,
    product,
    productPriceChangeOptions,
    quantity,
    validateQuantityNumber,
    variantInfo,
  ]);

  useEffect(() => {
    const getNewProductPrice = async () => {
      try {
        if (chooseOptionsProduct.length) {
          setIsRequestLoading(true);
          const products = await calculateProductListPrice(chooseOptionsProduct);

          if (products[0]) {
            const { basePrice, taxPrice } = products[0];
            const price = getBCPrice(+basePrice, +taxPrice);
            setNewPrice(price);
          }
        }
      } catch (err) {
        b2bLogger.error(err);
      } finally {
        setIsRequestLoading(false);
      }
    };

    getNewProductPrice();
  }, [chooseOptionsProduct]);

  const handleConfirmClicked = () => {
    handleSubmit((value) => {
      const optionList = getOptionList(value);

      const { variant_id: variantId = '' } = variantInfo || {};

      if (!product || !product.id || !variantId || !validateQuantityNumber()) {
        return;
      }

      onConfirm([
        {
          ...product,
          newSelectOptionList: optionList,
          productId: product?.id,
          quantity: parseInt(quantity.toString(), 10) || 1,
          variantId: parseInt(variantId.toString(), 10) || 1,
          additionalProducts,
        },
      ]);
    })();
  };

  const handleCancelClicked = () => {
    setQuantity(1);
    onCancel();
  };

  useEffect(() => {
    if (!isOpen) {
      reset();
    }
    // disabling as reset does not change between renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  return (
    <B3Dialog
      isOpen={isOpen}
      rightSizeBtn={isEdit ? b3Lang('shoppingList.chooseOptionsDialog.saveOption') : addButtonText}
      handleLeftClick={handleCancelClicked}
      handRightClick={handleConfirmClicked}
      title={b3Lang('shoppingList.chooseOptionsDialog.chooseOptions')}
      loading={isLoading || isRequestLoading}
    >
      <B3Sping isSpinning={isLoading}>
        {product && (
          <Box>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                }}
              >
                <ProductImage src={product.imageUrl || PRODUCT_DEFAULT_IMAGE} />
                <Flex>
                  <FlexItem padding="0">
                    <Box
                      sx={{
                        marginLeft: '16px',
                      }}
                    >
                      <Typography variant="body1" color="#212121">
                        {product.name}
                      </Typography>
                      <Typography variant="body1" color="#616161">
                        {variantSku || product.sku}
                      </Typography>
                      {(product.product_options || []).map((option) => (
                        <ProductOptionText
                          key={`${option.option_id}`}
                        >{`${option.display_name}: ${option.display_value}`}</ProductOptionText>
                      ))}
                    </Box>
                  </FlexItem>

                  <FlexItem>
                    <span>{b3Lang('shoppingList.chooseOptionsDialog.price')}</span>
                    {!isShowPrice
                      ? ''
                      : currencyFormat(newPrice * +quantity || getProductPrice(product))}
                  </FlexItem>

                  <FlexItem>
                    <StyleTextField
                      type="number"
                      variant="filled"
                      label={b3Lang('shoppingList.chooseOptionsDialog.quantity')}
                      value={quantity}
                      onChange={handleProductQuantityChange}
                      onKeyDown={handleNumberInputKeyDown}
                      onBlur={handleNumberInputBlur}
                      size="small"
                      sx={{
                        width: '60%',
                        maxWidth: '100px',
                      }}
                    />
                  </FlexItem>
                </Flex>
              </Box>

              <Divider
                sx={{
                  margin: '16px 0 24px',
                }}
              />

              <B3CustomForm
                formFields={formFields}
                errors={errors}
                control={control}
                getValues={getValues}
                setValue={setValue}
              />
            </Box>
          </Box>
        )}
      </B3Sping>
    </B3Dialog>
  );
}
