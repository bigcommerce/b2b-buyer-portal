import { useEffect, useState } from 'react';
import { useB3Lang } from '@b3/lang';
import styled from '@emotion/styled';
import { Delete } from '@mui/icons-material';
import { Alert, Box, Grid, Typography } from '@mui/material';

import { B3QuantityTextField, successTip } from '@/components';
import B3Dialog from '@/components/B3Dialog';
import CustomButton from '@/components/button/CustomButton';
import B3Spin from '@/components/spin/B3Spin';
import { CART_URL, CHECKOUT_URL, PRODUCT_DEFAULT_IMAGE } from '@/constants';
import { useMobile } from '@/hooks';
import { activeCurrencyInfoSelector, rolePermissionSelector, useAppSelector } from '@/store';
import { currencyFormat, snackbar } from '@/utils';
import { setModifierQtyPrice } from '@/utils/b3Product/b3Product';
import {
  addLineItems,
  getProductOptionsFields,
  ProductsProps,
} from '@/utils/b3Product/shared/config';
import b3TriggerCartNumber from '@/utils/b3TriggerCartNumber';
import { callCart } from '@/utils/cartUtils';

interface ShoppingProductsProps {
  shoppingListInfo: any;
  role: string | number;
  products: ProductsProps[];
  successProducts: number;
  allowJuniorPlaceOrder: boolean;
  getProductQuantity?: (item: ProductsProps) => number;
  onProductChange?: (products: ProductsProps[]) => void;
  setValidateFailureProducts: (arr: ProductsProps[]) => void;
  setValidateSuccessProducts: (arr: ProductsProps[]) => void;
  textAlign?: string;
}

interface FlexProps {
  isHeader?: boolean;
  isMobile?: boolean;
}

interface FlexItemProps {
  width?: string;
  padding?: string;
  flexBasis?: string;
  alignItems?: string;
  flexDirection?:
    | 'column'
    | 'inherit'
    | '-moz-initial'
    | 'initial'
    | 'revert'
    | 'unset'
    | 'column-reverse'
    | 'row'
    | 'row-reverse';
  textAlignLocation?: string;
}

const Flex = styled('div')<FlexProps>(({ isHeader, isMobile }) => {
  const headerStyle = isHeader
    ? {
        borderBottom: '1px solid #D9DCE9',
        paddingBottom: '8px',
        alignItems: 'center',
      }
    : {
        alignItems: 'flex-start',
      };

  const mobileStyle = isMobile
    ? {
        borderTop: '1px solid #D9DCE9',
        padding: '12px 0 12px',
        '&:first-of-type': {
          marginTop: '12px',
        },
      }
    : {};

  const flexWrap = isMobile ? 'wrap' : 'initial';

  return {
    display: 'flex',
    wordBreak: 'break-word',
    padding: '8px 0 0',
    gap: '8px',
    flexWrap,
    ...headerStyle,
    ...mobileStyle,
  };
});

const FlexItem = styled(Box)(
  ({
    width,
    padding = '0',
    flexBasis,
    flexDirection = 'row',
    alignItems,
    textAlignLocation,
  }: FlexItemProps) => ({
    display: 'flex',
    justifyContent: textAlignLocation === 'right' ? 'flex-end' : 'flex-start',
    flexDirection,
    flexGrow: width ? 0 : 1,
    flexShrink: width ? 0 : 1,
    alignItems: alignItems || 'flex-start',
    flexBasis,
    width,
    padding,
  }),
);

const ProductHead = styled('div')(() => ({
  fontSize: '0.875rem',
  lineHeight: '1.5',
  color: '#263238',
}));

const ProductImage = styled('img')(() => ({
  width: '60px',
  borderRadius: '4px',
  flexShrink: 0,
}));

const defaultItemStyle = {
  default: {
    width: '15%',
  },
  qty: {
    width: '80px',
  },
  delete: {
    width: '30px',
  },
};

const mobileItemStyle = {
  default: {
    width: '100%',
    padding: '0 0 0 76px',
  },
  qty: {
    width: '100%',
    padding: '0 0 0 76px',
  },
  delete: {
    width: '100%',
    padding: '0 0 0 76px',
    display: 'flex',
    flexDirection: 'row-reverse',
  },
};

export default function ReAddToCart(props: ShoppingProductsProps) {
  const {
    shoppingListInfo,
    products,
    successProducts,
    allowJuniorPlaceOrder,
    setValidateFailureProducts,
    setValidateSuccessProducts,
    textAlign = 'left',
  } = props;

  const { submitShoppingListPermission } = useAppSelector(rolePermissionSelector);

  const b3Lang = useB3Lang();
  const [isOpen, setOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [isMobile] = useMobile();

  const { decimal_places: decimalPlaces = 2 } = useAppSelector(activeCurrencyInfoSelector);

  useEffect(() => {
    if (products.length > 0) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [products]);

  const itemStyle = isMobile ? mobileItemStyle : defaultItemStyle;

  const handleUpdateProductQty = async (
    index: number,
    value: number | string,
    isValid: boolean,
  ) => {
    const newProduct: ProductsProps[] = [...products];
    newProduct[index].node.quantity = Number(value);
    newProduct[index].isValid = isValid;
    const calculateProduct = await setModifierQtyPrice(newProduct[index].node, Number(value));
    if (calculateProduct) {
      (newProduct[index] as CustomFieldItems).node = calculateProduct;
      setValidateFailureProducts(newProduct);
    }
  };

  const handleCancelClicked = () => {
    setOpen(false);
    setValidateFailureProducts([]);
    setValidateSuccessProducts([]);
  };

  const deleteProduct = (index: number) => {
    const newProduct: ProductsProps[] = [...products];
    newProduct.splice(index, 1);
    setValidateFailureProducts(newProduct);
  };

  const handRightClick = async () => {
    const isValidate = products.every((item: ProductsProps) => item.isValid);

    if (!isValidate) {
      snackbar.error(b3Lang('shoppingList.reAddToCart.fillCorrectQuantity'));
      return;
    }
    try {
      setLoading(true);

      const lineItems = addLineItems(products);

      const res = await callCart(lineItems);

      if (!res.errors) {
        handleCancelClicked();
        if (
          allowJuniorPlaceOrder &&
          submitShoppingListPermission &&
          shoppingListInfo?.status === 0
        ) {
          window.location.href = CHECKOUT_URL;
        } else {
          snackbar.success('', {
            jsx: successTip({
              message: b3Lang('shoppingList.reAddToCart.productsAdded'),
              link: CART_URL,
              linkText: b3Lang('shoppingList.reAddToCart.viewCart'),
              isOutLink: true,
              isCustomEvent: true,
            }),
            isClose: true,
          });
          b3TriggerCartNumber();
        }
      }

      if (res.errors) {
        snackbar.error(res.message, {
          isClose: true,
        });
      }

      b3TriggerCartNumber();
    } finally {
      setLoading(false);
    }
  };

  const handleClearNoStock = async () => {
    const newProduct = products.filter(
      (item: ProductsProps) => item.isStock === '0' || item.stock !== 0,
    );
    const requestArr: Promise<any>[] = [];
    newProduct.forEach((product) => {
      const item = product;
      const {
        node: { quantity },
        minQuantity = 0,
        maxQuantity = 0,
        isStock,
        stock,
      } = product;

      const quantityNumber = parseInt(`${quantity}`, 10) || 0;
      if (minQuantity !== 0 && quantityNumber < minQuantity) {
        item.node.quantity = minQuantity;
      } else if (maxQuantity !== 0 && quantityNumber > maxQuantity) {
        item.node.quantity = maxQuantity;
      }
      if (isStock !== '0' && stock && (quantity ? Number(quantity) : 0) > stock) {
        item.node.quantity = stock;
      }

      item.isValid = true;

      const qty = product?.node?.quantity ? Number(product.node.quantity) : 0;

      requestArr.push(setModifierQtyPrice(product.node, qty));
    });

    const productArr = await Promise.all(requestArr);

    productArr.forEach((item, index) => {
      newProduct[index].node = item;
    });
    setValidateFailureProducts(newProduct);
  };

  return (
    <B3Dialog
      isOpen={isOpen}
      handleLeftClick={handleCancelClicked}
      handRightClick={handRightClick}
      title={
        allowJuniorPlaceOrder
          ? b3Lang('shoppingList.reAddToCart.proceedToCheckout')
          : b3Lang('shoppingList.reAddToCart.addToCart')
      }
      rightSizeBtn={
        allowJuniorPlaceOrder
          ? b3Lang('shoppingList.reAddToCart.proceedToCheckout')
          : b3Lang('shoppingList.reAddToCart.addToCart')
      }
      maxWidth="xl"
    >
      <Grid>
        <Box
          sx={{
            m: '0 0 1rem 0',
          }}
        >
          <Alert variant="filled" severity="success">
            {allowJuniorPlaceOrder
              ? b3Lang('shoppingList.reAddToCart.productsCanCheckout', {
                  successProducts,
                })
              : b3Lang('shoppingList.reAddToCart.productsAddedToCart', {
                  successProducts,
                })}
          </Alert>
        </Box>

        <Box
          sx={{
            m: '1rem 0',
          }}
        >
          <Alert variant="filled" severity="error">
            {allowJuniorPlaceOrder
              ? b3Lang('shoppingList.reAddToCart.productsCantCheckout', {
                  quantity: products.length,
                })
              : b3Lang('shoppingList.reAddToCart.productsNotAddedToCart', {
                  quantity: products.length,
                })}
          </Alert>
        </Box>
        <B3Spin isSpinning={loading} size={16} isFlex={false}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              margin: '0.5rem 0 1rem 0',
            }}
          >
            <Box
              sx={{
                fontSize: '24px',
              }}
            >
              {b3Lang('shoppingList.reAddToCart.productCount', {
                quantity: products.length,
              })}
            </Box>
            <CustomButton onClick={() => handleClearNoStock()}>
              {b3Lang('shoppingList.reAddToCart.adjustQuantity')}
            </CustomButton>
          </Box>

          {products.length > 0 ? (
            <Box>
              {!isMobile && (
                <Flex isHeader isMobile={isMobile}>
                  <FlexItem>
                    <ProductHead>{b3Lang('shoppingList.reAddToCart.product')}</ProductHead>
                  </FlexItem>
                  <FlexItem {...itemStyle.default} textAlignLocation={textAlign}>
                    <ProductHead>{b3Lang('shoppingList.reAddToCart.price')}</ProductHead>
                  </FlexItem>
                  <FlexItem
                    sx={{
                      justifyContent: 'center',
                    }}
                    {...itemStyle.default}
                    textAlignLocation={textAlign}
                  >
                    <ProductHead>{b3Lang('shoppingList.reAddToCart.quantity')}</ProductHead>
                  </FlexItem>
                  <FlexItem {...itemStyle.default} textAlignLocation={textAlign}>
                    <ProductHead>{b3Lang('shoppingList.reAddToCart.total')}</ProductHead>
                  </FlexItem>
                  <FlexItem {...itemStyle.delete}>
                    <ProductHead> </ProductHead>
                  </FlexItem>
                </Flex>
              )}
              {products.map((product: ProductsProps, index: number) => {
                const { isStock, maxQuantity, minQuantity, stock } = product;

                const {
                  quantity = 1,
                  primaryImage,
                  productName,
                  variantSku,
                  optionList,
                  productsSearch,
                  basePrice,
                } = product.node;

                const price = Number(basePrice);
                const total = (price * (quantity ? Number(quantity) : 0)).toFixed(decimalPlaces);

                const newProduct: any = {
                  ...productsSearch,
                  selectOptions: optionList,
                };

                const productFields = getProductOptionsFields(newProduct, {});

                const newOptionList = JSON.parse(optionList);
                const optionsValue: CustomFieldItems[] = productFields.filter(
                  (item) => item.valueText,
                );

                return (
                  <Flex isMobile={isMobile} key={variantSku}>
                    <FlexItem>
                      <ProductImage src={primaryImage || PRODUCT_DEFAULT_IMAGE} />
                      <Box
                        sx={{
                          marginLeft: '16px',
                        }}
                      >
                        <Typography variant="body1" color="#212121">
                          {productName}
                        </Typography>
                        <Typography variant="body1" color="#616161">
                          {variantSku}
                        </Typography>
                        {newOptionList.length > 0 &&
                          optionsValue.length > 0 &&
                          optionsValue.map((option: CustomFieldItems) => (
                            <Typography
                              sx={{
                                fontSize: '0.75rem',
                                lineHeight: '1.5',
                                color: '#455A64',
                              }}
                              key={option.valueLabel}
                            >
                              {`${option.valueLabel}: ${option.valueText}`}
                            </Typography>
                          ))}
                      </Box>
                    </FlexItem>
                    <FlexItem {...itemStyle.default} textAlignLocation={textAlign}>
                      {isMobile && <span>Price: </span>}
                      {currencyFormat(price)}
                    </FlexItem>
                    <FlexItem {...itemStyle.default} textAlignLocation={textAlign}>
                      <B3QuantityTextField
                        isStock={isStock}
                        maxQuantity={maxQuantity}
                        minQuantity={minQuantity}
                        stock={stock}
                        value={quantity}
                        onChange={(value, isValid) => {
                          handleUpdateProductQty(index, value, isValid);
                        }}
                      />
                    </FlexItem>
                    <FlexItem {...itemStyle.default} textAlignLocation={textAlign}>
                      {isMobile && <div>Total: </div>}
                      {currencyFormat(total)}
                    </FlexItem>

                    <FlexItem {...itemStyle.delete}>
                      <Delete
                        sx={{
                          cursor: 'pointer',
                          color: 'rgba(0, 0, 0, 0.54)',
                        }}
                        onClick={() => {
                          deleteProduct(index);
                        }}
                      />
                    </FlexItem>
                  </Flex>
                );
              })}
            </Box>
          ) : null}
        </B3Spin>
      </Grid>
    </B3Dialog>
  );
}
