import { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { Delete } from '@mui/icons-material';
import { Alert, Box, Grid, Typography } from '@mui/material';
import { cloneDeep } from 'lodash-es';

import B3Dialog from '@/components/B3Dialog';
import CustomButton from '@/components/button/CustomButton';
import B3Spin from '@/components/spin/B3Spin';
import { PRODUCT_DEFAULT_IMAGE } from '@/constants';
import { useMobile } from '@/hooks/useMobile';
import { useB3Lang } from '@/lib/lang';
import { activeCurrencyInfoSelector, useAppSelector } from '@/store';
import { currencyFormat } from '@/utils/b3CurrencyFormat';
import { setModifierQtyPrice } from '@/utils/b3Product/b3Product';
import { getProductOptionsFields, ProductsProps } from '@/utils/b3Product/shared/config';

import { B3QuantityTextField } from './B3QuantityTextField';

interface ShoppingProductsProps {
  isOpen: boolean;
  onCancel: () => void;
  onAddToCart: (products: ProductsProps[]) => Promise<void>;
  shoppingListInfo: any;
  products: ProductsProps[];
  successProducts: number;
  allowJuniorPlaceOrder: boolean;
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

const FlexItem = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'textAlignLocation',
})(
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

export default function ReAddToCart({
  isOpen,
  onCancel,
  onAddToCart,
  products,
  successProducts,
  allowJuniorPlaceOrder,
}: ShoppingProductsProps) {
  const b3Lang = useB3Lang();
  const [loading, setLoading] = useState<boolean>(false);
  const [isMobile] = useMobile();
  const { decimal_places: decimalPlaces = 2 } = useAppSelector(activeCurrencyInfoSelector);

  const textAlign = isMobile ? 'left' : 'right';
  const itemStyle = isMobile ? mobileItemStyle : defaultItemStyle;

  const [internalProducts, setInternalProducts] = useState<ProductsProps[]>([]);

  useEffect(() => {
    setInternalProducts(cloneDeep(products));
  }, [products]);

  const handleUpdateProductQty = async (
    index: number,
    value: number | string,
    isValid: boolean,
  ) => {
    const newProduct: ProductsProps[] = [...internalProducts];

    newProduct[index].node.quantity = Number(value);
    newProduct[index].isValid = isValid;

    const calculateProduct = await setModifierQtyPrice(newProduct[index].node, Number(value));

    if (calculateProduct) {
      (newProduct[index] as CustomFieldItems).node = calculateProduct;
      setInternalProducts(newProduct);
    }
  };

  const deleteProduct = (index: number) => {
    if (internalProducts.length === 1) {
      onCancel();
    } else {
      setInternalProducts((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handlePrimaryAction = async () => {
    try {
      setLoading(true);
      await onAddToCart(internalProducts);
    } finally {
      setLoading(false);
    }
  };

  // this need the information of the SearchGraphQLQuery endpoint change
  const handleClearNoStock = async () => {
    const newProduct = internalProducts.filter((item) => item.isStock === '0' || item.stock !== 0);
    const requestArr: Array<Promise<any>> = [];

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

      const qty = product.node.quantity ? Number(product.node.quantity) : 0;

      requestArr.push(setModifierQtyPrice(product.node, qty));
    });

    const productArr = await Promise.all(requestArr);

    productArr.forEach((item, index) => {
      newProduct[index].node = item;
    });
    setInternalProducts(newProduct);
  };

  return (
    <B3Dialog
      handRightClick={handlePrimaryAction}
      handleLeftClick={onCancel}
      isOpen={isOpen}
      maxWidth="xl"
      rightSizeBtn={
        allowJuniorPlaceOrder
          ? b3Lang('shoppingList.reAddToCart.proceedToCheckout')
          : b3Lang('shoppingList.reAddToCart.addToCart')
      }
      title={
        allowJuniorPlaceOrder
          ? b3Lang('shoppingList.reAddToCart.proceedToCheckout')
          : b3Lang('shoppingList.reAddToCart.addToCart')
      }
    >
      <Grid>
        <Box
          sx={{
            m: '0 0 1rem 0',
          }}
        >
          {successProducts > 0 && (
            <Alert severity="success" variant="filled">
              {allowJuniorPlaceOrder
                ? b3Lang('shoppingList.reAddToCart.productsCanCheckout', {
                    successProducts,
                  })
                : b3Lang('shoppingList.reAddToCart.productsAddedToCart', {
                    successProducts,
                  })}
            </Alert>
          )}
        </Box>

        <Box
          sx={{
            m: '1rem 0',
          }}
        >
          {internalProducts.length > 0 && (
            <Alert severity="error" variant="filled">
              {allowJuniorPlaceOrder
                ? b3Lang('shoppingList.reAddToCart.productsCantCheckout', {
                    quantity: internalProducts.length,
                  })
                : b3Lang('shoppingList.reAddToCart.productsNotAddedToCart', {
                    quantity: internalProducts.length,
                  })}
            </Alert>
          )}
        </Box>
        <B3Spin isFlex={false} isSpinning={loading} size={16}>
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
                quantity: internalProducts.length,
              })}
            </Box>
            <CustomButton onClick={() => handleClearNoStock()}>
              {b3Lang('shoppingList.reAddToCart.adjustQuantity')}
            </CustomButton>
          </Box>

          {internalProducts.length > 0 ? (
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
              {internalProducts.map((product: ProductsProps, index: number) => {
                const { isStock, maxQuantity, minQuantity, stock, node } = product;

                const {
                  id,
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
                  <Flex isMobile={isMobile} key={id}>
                    <FlexItem>
                      <ProductImage src={primaryImage || PRODUCT_DEFAULT_IMAGE} />
                      <Box
                        sx={{
                          marginLeft: '16px',
                        }}
                      >
                        <Typography color="#212121" variant="body1">
                          {productName}
                        </Typography>
                        <Typography color="#616161" variant="body1">
                          {variantSku}
                        </Typography>
                        {newOptionList.length > 0 &&
                          optionsValue.length > 0 &&
                          optionsValue.map((option: CustomFieldItems) => (
                            <Typography
                              key={option.valueLabel}
                              sx={{
                                fontSize: '0.75rem',
                                lineHeight: '1.5',
                                color: '#455A64',
                              }}
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
                        maxQuantity={maxQuantity || node.productsSearch?.orderQuantityMaximum}
                        minQuantity={minQuantity || node.productsSearch?.orderQuantityMinimum}
                        onChange={(value, isValid) => {
                          handleUpdateProductQty(index, value, isValid);
                        }}
                        stock={stock}
                        value={quantity}
                      />
                    </FlexItem>
                    <FlexItem {...itemStyle.default} textAlignLocation={textAlign}>
                      {isMobile && <div>Total: </div>}
                      {currencyFormat(total)}
                    </FlexItem>

                    <FlexItem {...itemStyle.delete}>
                      <Delete
                        onClick={() => {
                          deleteProduct(index);
                        }}
                        sx={{
                          cursor: 'pointer',
                          color: 'rgba(0, 0, 0, 0.54)',
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
