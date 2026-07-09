import { ChangeEvent, KeyboardEvent, ReactElement, useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { Box, Button, Checkbox, FormControlLabel, TextField, Typography } from '@mui/material';
import noop from 'lodash-es/noop';

import BackorderMessage from '@/components/BackorderMessage';
import { PRODUCT_DEFAULT_IMAGE } from '@/constants';
import { useMobile } from '@/hooks/useMobile';
import { useB3Lang } from '@/lib/lang';
import type { CatalogQuickVariantSku } from '@/shared/service/b2b/graphql/product';
import { useAppSelector } from '@/store';
import { currencyFormat, ordersCurrencyFormat } from '@/utils/b3CurrencyFormat';
import { getDisplayPrice, judgmentBuyerProduct } from '@/utils/b3Product/b3Product';
import {
  getCatalogProductRowDisplayState,
  productRequiresChooseOptionsBeforeAdd,
} from '@/utils/catalogBackorderDisplay';

import { MoneyFormat, ProductItem } from '../types';

interface FlexProps {
  isHeader?: boolean;
  isMobile?: boolean;
}

interface FlexItemProps {
  width?: string;
  padding?: string;
  textAlignLocation?: string;
  sx?: {
    [key: string]: string | number;
  };
}

const Flex = styled('div')<FlexProps>(({ isHeader, isMobile }) => {
  const headerStyle = isHeader
    ? {
        borderBottom: '1px solid #D9DCE9',
        paddingBottom: '8px',
      }
    : {};

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
    color: '#212121',
    display: 'flex',
    padding: '8px 0 0',
    gap: '8px',
    flexWrap,
    alignItems: ' flex-start',
    ...headerStyle,
    ...mobileStyle,
  };
});

const FlexItem = styled('div')(
  ({ width, textAlignLocation, padding = '0', sx }: FlexItemProps) => ({
    display: 'flex',
    justifyContent: textAlignLocation === 'right' ? 'flex-end' : 'flex-start',
    flexGrow: width ? 0 : 1,
    flexShrink: width ? 0 : 1,
    alignItems: 'center',
    width,
    padding,
    ...sx,
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

const ProductOptionText = styled('div')(() => ({
  fontSize: '0.75rem',
  lineHeight: '1.5',
  color: '#455A64',
}));

const defaultItemStyle = {
  default: {
    width: '15%',
  },
  qty: {
    width: '12%',
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
};

type ProductListItemStyle = typeof defaultItemStyle;

interface BackorderLayoutStyles {
  qtyColumn: ProductListItemStyle['qty'];
  qtyColumnSx: FlexItemProps['sx'];
  numericColumn: ProductListItemStyle['default'];
  productColumnPadding: string;
  productColumnSx: FlexItemProps['sx'];
}

function getBackorderLayoutStyles(
  desktopBackorderLayoutEnabled: boolean,
  isMobile: boolean,
  itemStyle: ProductListItemStyle,
): BackorderLayoutStyles {
  let productColumnPadding = '0 6% 0 0';
  if (isMobile) {
    productColumnPadding = '0';
  } else if (desktopBackorderLayoutEnabled) {
    productColumnPadding = '0 16px 0 0';
  }

  return {
    qtyColumn: desktopBackorderLayoutEnabled ? { width: '16%' } : itemStyle.qty,
    qtyColumnSx: desktopBackorderLayoutEnabled ? { minWidth: '140px' } : undefined,
    numericColumn: desktopBackorderLayoutEnabled ? { width: '12%' } : itemStyle.default,
    productColumnPadding,
    productColumnSx: desktopBackorderLayoutEnabled ? { flex: '1 1 42%', minWidth: 0 } : undefined,
  };
}

interface ProductProps<T extends ProductItem = ProductItem> {
  products: Array<T & ProductItem>;
  money?: MoneyFormat;
  /** Order currency code (e.g. "USD"). When provided without `money`, uses Intl.NumberFormat. */
  currencyCode?: string;
  renderAction?: (item: T & ProductItem) => ReactElement;
  actionWidth?: string;
  quantityKey?: string;
  quantityEditable?: boolean;
  onProductQuantityChange?: (id: number, newQuantity: number) => void;
  showCheckbox?: boolean;
  setCheckedArr?: (items: Array<T & ProductItem>) => void;
  selectAllText?: string;
  totalText?: string;
  canToProduct?: boolean;
  textAlign?: string;
  type?: string;
  getCurrentProductUrls?: (productId: number | undefined) => void;
  catalogBackorderUiEnabled?: boolean;
  catalogInventoryBySku?: Record<string, CatalogQuickVariantSku>;
  showAvailableToSellHelper?: boolean;
  formatOnlyAvailable?: (availableToSell: number) => string;
}

function getProductVariantSku(product: ProductItem): string {
  // List backorder UI only runs for no-options rows; the sole variant is always variants[0].
  return product.variants?.[0]?.sku ?? product.sku;
}

export function B3ProductList<T extends ProductItem>(props: ProductProps<T>) {
  const {
    products,
    renderAction,
    quantityKey = 'quantity',
    actionWidth = '100px',
    quantityEditable = false,
    onProductQuantityChange = noop,
    showCheckbox = false,
    setCheckedArr = noop,
    selectAllText = 'Select all products',
    totalText = 'Total',
    canToProduct = false,
    textAlign = 'left',
    money,
    currencyCode,
    type,
    getCurrentProductUrls,
    catalogBackorderUiEnabled = false,
    catalogInventoryBySku,
    showAvailableToSellHelper = false,
    formatOnlyAvailable = () => '',
  } = props;

  const [list, setList] = useState<ProductItem[]>([]);
  const [isMobile] = useMobile();
  const b3Lang = useB3Lang();
  const showInclusiveTaxPrice = useAppSelector(({ global }) => global.showInclusiveTaxPrice);
  const quantityStackItemsAlignment = textAlign === 'right' ? 'flex-end' : 'flex-start';

  const getQuantity = (product: any) => parseInt(product[quantityKey]?.toString() || '', 10) || '';

  const getProductTotals = (quantity: number, price: string | number) => {
    const priceNumber = parseFloat(price.toString()) || 0;

    return quantity * priceNumber;
  };

  const handleProductQuantityChange = (id: number) => (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value || parseInt(e.target.value, 10) > 0) {
      onProductQuantityChange(id, e.target.value);
    }
  };

  const handleNumberInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (['KeyE', 'Equal', 'Minus'].indexOf(event.code) > -1) {
      event.preventDefault();
    }
  };

  const handleNumberInputBlur = (product: CustomFieldItems) => () => {
    if (!product[quantityKey]) {
      onProductQuantityChange(product.id, 1);
    }

    if (Number(product[quantityKey]) > 1000000) {
      onProductQuantityChange(product.id, 1000000);
    }
  };

  const handleSelectAllChange = () => {
    const newList = [...list];
    if (newList.length === products.length) {
      setList([]);
    } else {
      setList([...products]);
    }
  };

  const handleSelectChange = (product: ProductItem) => {
    const newList = [...list];
    const index = newList.findIndex((item) => item.id === product.id);
    if (index !== -1) {
      newList.splice(index, 1);
    } else {
      newList.push(product);
    }
    setList(newList);
  };

  const isChecked = (product: ProductItem) =>
    list.findIndex((item) => item.id === product.id) !== -1;

  useEffect(() => {
    setCheckedArr(list);
    // disabling because dispatchers are not supposed to be here
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list]);

  useEffect(() => {
    setList([]);
  }, [products]);

  const itemStyle = isMobile ? mobileItemStyle : defaultItemStyle;
  const {
    qtyColumn: desktopQtyColumnStyle,
    qtyColumnSx: desktopQtyColumnExtraSx,
    numericColumn: desktopNumericColumnStyle,
    productColumnPadding: desktopProductColumnPadding,
    productColumnSx: desktopProductColumnSx,
  } = getBackorderLayoutStyles(catalogBackorderUiEnabled && !isMobile, isMobile, itemStyle);

  const showTypePrice = (newMoney: string | number, product: CustomFieldItems): string | number => {
    if (type === 'quote') {
      return getDisplayPrice({
        price: newMoney,
        productInfo: product,
        isProduct: true,
      });
    }
    if (type === 'shoppingList' || type === 'quickOrder') {
      const { isPriceHidden } = product;
      const isBuyerProduct = judgmentBuyerProduct({
        price: newMoney,
        productInfo: product,
        isProduct: true,
      });
      return isPriceHidden && !isBuyerProduct ? '' : newMoney;
    }

    return newMoney;
  };

  return products.length > 0 ? (
    <Box>
      {!isMobile && (
        <Flex isHeader isMobile={isMobile}>
          {showCheckbox && (
            <Checkbox checked={list.length === products.length} onChange={handleSelectAllChange} />
          )}
          <FlexItem padding={desktopProductColumnPadding} sx={desktopProductColumnSx}>
            <ProductHead>{b3Lang('global.searchProduct.product')}</ProductHead>
          </FlexItem>
          <FlexItem textAlignLocation={textAlign} {...desktopNumericColumnStyle}>
            <ProductHead>{b3Lang('global.searchProduct.price')}</ProductHead>
          </FlexItem>
          <FlexItem
            textAlignLocation={textAlign}
            {...desktopQtyColumnStyle}
            sx={desktopQtyColumnExtraSx}
          >
            <ProductHead>{b3Lang('global.searchProduct.qty')}</ProductHead>
          </FlexItem>
          <FlexItem textAlignLocation={textAlign} {...desktopNumericColumnStyle}>
            <ProductHead>{b3Lang('global.searchProduct.total')}</ProductHead>
          </FlexItem>
          {renderAction && (
            <FlexItem
              {...desktopNumericColumnStyle}
              textAlignLocation="right"
              width={isMobile ? '100%' : actionWidth}
            />
          )}
        </Flex>
      )}

      {isMobile && showCheckbox && (
        <FormControlLabel
          label={selectAllText}
          control={
            <Checkbox checked={list.length === products.length} onChange={handleSelectAllChange} />
          }
          sx={{
            paddingLeft: '0.6rem',
          }}
        />
      )}

      {products.map((product) => {
        const { variants = [], applied_discounts: appliedDiscounts = [] } = product;
        const quantity = getQuantity(product) || 1;
        const originQuantity = Number(product.quantity) || 1;

        let discountAccountForSingleProduct = 0;
        appliedDiscounts.forEach((discount) => {
          if (discount.target === 'product') {
            discountAccountForSingleProduct += Number(discount.amount) / originQuantity;
          }
        });

        const currentVariant = variants[0];
        let productPrice = Number(product.base_price);
        if (currentVariant) {
          const bcCalculatedPrice = currentVariant.bc_calculated_price;

          productPrice = showInclusiveTaxPrice
            ? Number(bcCalculatedPrice.tax_inclusive)
            : Number(bcCalculatedPrice.tax_exclusive);
        }

        if (!currentVariant) {
          const priceIncTax = product?.price_inc_tax || product.base_price;
          const priceExTax = product?.price_ex_tax || product.base_price;

          productPrice = showInclusiveTaxPrice ? Number(priceIncTax) : Number(priceExTax);
        }

        const totalPrice = getProductTotals(quantity, productPrice);

        const discountedPrice = Number(productPrice) - Number(discountAccountForSingleProduct);
        const discountedTotalPrice = getProductTotals(quantity, discountedPrice);

        const variantSku = getProductVariantSku(product);
        const inventoryRow = productRequiresChooseOptionsBeforeAdd(product)
          ? undefined
          : catalogInventoryBySku?.[variantSku.toUpperCase()];
        const { qtyHelperText, backorderFields } = getCatalogProductRowDisplayState({
          qty: Number(quantity) || 0,
          productHelperText: product.helperText,
          showAvailableToSellHelper,
          inventoryRow,
          backorderUiEnabled: catalogBackorderUiEnabled,
          formatOnlyAvailable,
        });

        const getDisplayPrice = (priceValue: number, preFormatted?: string) => {
          if (preFormatted) return showTypePrice(preFormatted, product);

          let formatted: string;
          if (money) {
            formatted = ordersCurrencyFormat(money, priceValue);
          } else if (currencyCode) {
            formatted = new Intl.NumberFormat('en', {
              style: 'currency',
              currency: currencyCode,
            }).format(priceValue);
          } else {
            formatted = currencyFormat(priceValue);
          }

          return showTypePrice(formatted, product);
        };

        const hasDiscounts = discountAccountForSingleProduct > 0;
        const safeFormattedPrice = hasDiscounts ? undefined : product.formattedPrice;
        const safeFormattedTotal = hasDiscounts ? undefined : product.formattedTotal;

        const renderPrice = (
          priceLabel: string,
          priceValue: number,
          priceDiscountedValue: number,
          preFormatted?: string,
        ) => {
          return (
            <FlexItem
              textAlignLocation={textAlign}
              padding={quantityEditable ? '10px 0 0' : ''}
              {...desktopNumericColumnStyle}
              sx={
                isMobile
                  ? {
                      fontSize: '14px',
                    }
                  : {}
              }
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  justifyContent: textAlign === 'right' ? 'flex-end' : 'flex-start',
                }}
              >
                <Box
                  sx={{
                    '& #product-price': {
                      textDecoration: hasDiscounts ? 'line-through' : 'none',
                    },
                  }}
                >
                  {isMobile && <span>{priceLabel}: </span>}
                  <span id="product-price">{getDisplayPrice(priceValue, preFormatted)}</span>
                </Box>
                {hasDiscounts ? (
                  <Box
                    sx={{
                      color: '#2E7D32',
                    }}
                  >
                    {getDisplayPrice(priceDiscountedValue)}
                  </Box>
                ) : null}
              </Box>
            </FlexItem>
          );
        };

        return (
          <Flex isMobile={isMobile} key={product.id}>
            {showCheckbox && (
              <Checkbox checked={isChecked(product)} onChange={() => handleSelectChange(product)} />
            )}
            <FlexItem padding={desktopProductColumnPadding} sx={desktopProductColumnSx}>
              <ProductImage src={product.imageUrl || PRODUCT_DEFAULT_IMAGE} />
              <Box
                sx={{
                  marginLeft: '16px',
                  ...(isMobile
                    ? {}
                    : {
                        flex: 1,
                        minWidth: 0,
                      }),
                }}
              >
                <Typography
                  variant="body1"
                  color="#212121"
                  onClick={() => {
                    if (canToProduct) {
                      const {
                        location: { origin },
                      } = window;

                      if (product?.productUrl)
                        window.location.href = `${origin}${product?.productUrl}`;
                    }
                  }}
                  sx={{
                    cursor: 'pointer',
                  }}
                >
                  {product.name}
                </Typography>
                <Typography variant="body1" color="#616161">
                  {product.sku}
                </Typography>
                {product.type === 'digital' &&
                  product.downloadFileUrls &&
                  product.downloadFileUrls.length > 0 && (
                    <Button
                      sx={{
                        m: '0 0 0 -8px',
                        minWidth: 0,
                      }}
                      variant="text"
                      onClick={() => getCurrentProductUrls?.(product.product_id)}
                    >
                      {b3Lang('orderDetail.digitalProducts.viewFiles')}
                    </Button>
                  )}
                {(product.product_options || []).map((option) => (
                  <ProductOptionText
                    key={`${option.option_id}`}
                  >{`${option.display_name}: ${option.display_value}`}</ProductOptionText>
                ))}
              </Box>
            </FlexItem>

            {renderPrice('Price', productPrice, discountedPrice, safeFormattedPrice)}
            <FlexItem
              textAlignLocation={textAlign}
              {...desktopQtyColumnStyle}
              sx={{
                ...desktopQtyColumnExtraSx,
                ...(isMobile
                  ? {
                      fontSize: '14px',
                    }
                  : {}),
              }}
            >
              {quantityEditable ? (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: quantityStackItemsAlignment,
                    width: '100%',
                    maxWidth: '100%',
                    minWidth: 0,
                  }}
                >
                  <TextField
                    type="number"
                    variant="filled"
                    hiddenLabel={!isMobile}
                    label={isMobile ? 'Qty' : ''}
                    value={quantity}
                    onChange={handleProductQuantityChange(product.id)}
                    onKeyDown={handleNumberInputKeyDown}
                    onBlur={handleNumberInputBlur(product)}
                    size="small"
                    sx={{
                      width: isMobile ? '110px' : '72px',
                      '& .MuiFormHelperText-root': {
                        marginLeft: '0',
                        marginRight: '0',
                      },
                    }}
                    error={Boolean(qtyHelperText)}
                    helperText={qtyHelperText || undefined}
                  />
                  {backorderFields && (
                    <Box
                      sx={{
                        mt: 1,
                        width: '100%',
                        maxWidth: '100%',
                        minWidth: 0,
                        textAlign,
                        alignSelf: quantityStackItemsAlignment,
                      }}
                    >
                      <BackorderMessage
                        totalOnHand={backorderFields.totalOnHand}
                        quantityBackordered={backorderFields.quantityBackordered}
                        backorderMessage={backorderFields.backorderMessage}
                        visible
                      />
                    </Box>
                  )}
                </Box>
              ) : (
                <>
                  {isMobile && <span>Qty: </span>}
                  {quantity}
                </>
              )}
            </FlexItem>

            {renderPrice(totalText, totalPrice, discountedTotalPrice, safeFormattedTotal)}
            {renderAction && (
              <FlexItem
                {...desktopNumericColumnStyle}
                textAlignLocation="right"
                width={isMobile ? '100%' : actionWidth}
              >
                <>{renderAction(product)}</>
              </FlexItem>
            )}
          </Flex>
        );
      })}
    </Box>
  ) : null;
}
