import { ChangeEvent, KeyboardEvent, useEffect, useState } from 'react';
import { Box, Checkbox, FormControlLabel, TextField, Typography } from '@mui/material';

import BackorderMessage from '@/components/BackorderMessage';
import { PRODUCT_DEFAULT_IMAGE } from '@/constants';
import { useMobile } from '@/hooks/useMobile';
import { useB3Lang } from '@/lib/lang';
import type { CatalogQuickVariantSku } from '@/shared/service/b2b/graphql/product';
import { currencyFormat } from '@/utils/b3CurrencyFormat';
import { snackbar } from '@/utils/b3Tip';
import { getCatalogProductRowDisplayState } from '@/utils/catalogBackorderDisplay';

import { EditableProductItem, OrderProductOption } from '../../../types';
import {
  defaultItemStyle,
  Flex,
  FlexItem,
  mobileItemStyle,
  ProductHead,
  ProductImage,
  ProductOptionText,
} from '../styled';

interface ReturnListProps {
  returnId: number;
  returnQty: number;
}
interface OrderCheckboxProductProps {
  products: EditableProductItem[];
  getProductQuantity?: (item: EditableProductItem) => number;
  onProductChange?: (products: EditableProductItem[]) => void;
  checkedArr?: number[];
  setCheckedArr?: (items: number[]) => void;
  setReturnArr?: (items: ReturnListProps[]) => void;
  textAlign?: string;
  type?: string;
  catalogInventoryBySku?: Record<string, CatalogQuickVariantSku>;
  backorderUiEnabled?: boolean;
  showReorderAtsHelper?: boolean;
}

export default function OrderCheckboxProduct(props: OrderCheckboxProductProps) {
  const {
    products,
    getProductQuantity = (item) => item.editQuantity,
    onProductChange = () => {},
    checkedArr = [],
    setCheckedArr = () => {},
    setReturnArr = () => {},
    textAlign = 'left',
    type,
    catalogInventoryBySku,
    backorderUiEnabled = false,
    showReorderAtsHelper = false,
  } = props;

  const b3Lang = useB3Lang();

  const [isMobile] = useMobile();

  const [returnList, setReturnList] = useState<ReturnListProps[]>([]);

  const usesCatalogBackorderInventory = type === 'reOrder' || type === 'shoppingList';

  const getProductTotals = (quantity: string | number, price: string | number) => {
    const priceNumber = parseFloat(price.toString()) || 0;
    const quantityNumber = parseInt(quantity.toString(), 10) || 0;

    return quantityNumber * priceNumber;
  };

  const itemStyle = isMobile ? mobileItemStyle : defaultItemStyle;
  const qtyStackAlignItems = textAlign === 'right' ? 'flex-end' : 'flex-start';
  const desktopQtyColumnStyle =
    backorderUiEnabled && !isMobile ? { width: '22%', minWidth: '160px' } : itemStyle.default;

  const handleSelectAllChange = () => {
    if (checkedArr.length === products.length) {
      setCheckedArr([]);
      setReturnList([]);
    } else {
      const productIds = products.map((item) => item.id);
      const returnIds: ReturnListProps[] = [];
      products.forEach((item, index) => {
        returnIds[index] = {
          returnId: item.id,
          returnQty: Number(item.editQuantity),
        };
      });

      setCheckedArr(productIds);
      setReturnList(returnIds);
    }
  };

  const handleSelectChange = (productId: number, returnId: number, returnQty: number) => {
    const newList = [...checkedArr];
    const newReturnList = [...returnList];
    const index = newList.findIndex((item) => item === productId);
    const returnIndex = newReturnList.findIndex((item) => item.returnId === returnId);
    if (index !== -1) {
      newList.splice(index, 1);
      newReturnList.splice(returnIndex, 1);
    } else {
      newList.push(productId);
      newReturnList.push({
        returnId,
        returnQty,
      });
    }
    setCheckedArr(newList);
    setReturnList(newReturnList);
  };

  const isChecked = (productId: number) => checkedArr.includes(productId);

  const handleProductQuantityChange =
    (product: EditableProductItem) => (e: ChangeEvent<HTMLInputElement>) => {
      const element = product;
      const valueNum = e.target.value;
      if (Number(valueNum) >= 0 && Number(valueNum) <= 1000000) {
        element.editQuantity = valueNum;
        if (type === 'reOrder') {
          element.helperText = '';
        }
        if (type === 'return') {
          if (Number(valueNum) > Number(product.quantity)) {
            element.editQuantity = product.quantity;
            snackbar.error(
              b3Lang('purchasedProducts.error.returnedQuantityShouldBeWithinThePurchase'),
            );
          } else {
            returnList.forEach((listItem) => {
              const item = listItem;
              if (item.returnId === product.id) {
                item.returnQty = Number(valueNum);
              }
            });
            setReturnArr(returnList);
          }
        }
        onProductChange([...products]);
      }
    };

  const handleNumberInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (['KeyE', 'Equal', 'Minus'].indexOf(event.code) > -1) {
      event.preventDefault();
    }
  };

  const handleNumberInputBlur = (product: EditableProductItem) => () => {
    const editableProduct = product;
    if (!product.editQuantity || Number(product.editQuantity) === 0) {
      editableProduct.editQuantity = '1';
      onProductChange([...products]);
    }
  };

  useEffect(() => {
    setReturnArr(returnList);
    // Disabling this line as this dispatcher does not need to be in the dep array
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [returnList]);

  return products.length > 0 ? (
    <Box>
      {!isMobile && (
        <Flex isHeader isMobile={isMobile}>
          <Checkbox
            checked={checkedArr.length === products.length}
            onChange={handleSelectAllChange}
          />
          <FlexItem>
            <ProductHead>{b3Lang('orderDetail.reorder.product')}</ProductHead>
          </FlexItem>
          <FlexItem textAlignLocation={textAlign} {...itemStyle.default}>
            <ProductHead>{b3Lang('orderDetail.reorder.price')}</ProductHead>
          </FlexItem>
          <FlexItem textAlignLocation={textAlign} {...desktopQtyColumnStyle}>
            <ProductHead>{b3Lang('orderDetail.reorder.qty')}</ProductHead>
          </FlexItem>
          <FlexItem textAlignLocation={textAlign} {...itemStyle.default}>
            <ProductHead>{b3Lang('orderDetail.reorder.total')}</ProductHead>
          </FlexItem>
        </Flex>
      )}

      {isMobile && (
        <FormControlLabel
          label="Select all products"
          control={
            <Checkbox
              checked={checkedArr.length === products.length}
              onChange={handleSelectAllChange}
            />
          }
          sx={{
            paddingLeft: '0.6rem',
          }}
        />
      )}

      {products.map((product: EditableProductItem) => {
        const qty = Number(getProductQuantity(product)) || 0;
        const { qtyHelperText, backorderFields } = getCatalogProductRowDisplayState({
          qty,
          productHelperText: product.helperText,
          showAvailableToSellHelper: showReorderAtsHelper,
          inventoryRow: usesCatalogBackorderInventory
            ? catalogInventoryBySku?.[product.sku.toUpperCase()]
            : undefined,
          backorderUiEnabled,
          formatOnlyAvailable: (count) => b3Lang('orderDetail.reorder.onlyAvailable', { count }),
        });

        return (
          <Flex
            isMobile={isMobile}
            key={product.sku}
            role="group"
            aria-labelledby={`group-label-${product.id}`}
          >
            <Checkbox
              checked={isChecked(product.id)}
              onChange={() =>
                handleSelectChange(product.id, product.id, Number(product.editQuantity))
              }
            />
            <FlexItem>
              <ProductImage src={product.imageUrl || PRODUCT_DEFAULT_IMAGE} />
              <Box
                sx={{
                  marginLeft: '16px',
                }}
              >
                <Typography variant="body1" color="#212121" id={`group-label-${product.id}`}>
                  {product.name}
                </Typography>
                <Typography variant="body1" color="#616161">
                  {product.sku}
                </Typography>
                {(product.product_options || []).map((option: OrderProductOption) => (
                  <ProductOptionText key={option.id}>
                    {`${option.display_name}: ${option.display_value}`}
                  </ProductOptionText>
                ))}
              </Box>
            </FlexItem>
            <FlexItem textAlignLocation={textAlign} padding="10px 0 0" {...itemStyle.default}>
              {isMobile && <span>{b3Lang('orderDetail.reorder.price')} </span>}
              {currencyFormat(product.base_price)}
            </FlexItem>
            <FlexItem
              textAlignLocation={textAlign}
              padding={isMobile ? undefined : '10px 0 0'}
              {...desktopQtyColumnStyle}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: qtyStackAlignItems,
                  width: '100%',
                  maxWidth: '100%',
                  minWidth: 0,
                }}
              >
                <TextField
                  type="number"
                  variant="filled"
                  hiddenLabel={!isMobile}
                  label={isMobile ? b3Lang('orderDetail.reorder.qty') : ''}
                  value={getProductQuantity(product)}
                  onChange={handleProductQuantityChange(product)}
                  onKeyDown={handleNumberInputKeyDown}
                  onBlur={handleNumberInputBlur(product)}
                  size="small"
                  sx={{
                    width: isMobile ? '60%' : '80px',
                    '& .MuiFormHelperText-root': {
                      marginLeft: '0',
                      marginRight: '0',
                    },
                  }}
                  error={Boolean(qtyHelperText)}
                  helperText={qtyHelperText}
                />
                {backorderFields && (
                  <Box
                    sx={{
                      mt: 1,
                      width: '100%',
                      maxWidth: '100%',
                      minWidth: 0,
                      textAlign,
                      alignSelf: qtyStackAlignItems,
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
            </FlexItem>
            <FlexItem textAlignLocation={textAlign} padding="10px 0 0" {...itemStyle.default}>
              {isMobile && <span>{b3Lang('orderDetail.reorder.total')} </span>}
              {currencyFormat(getProductTotals(getProductQuantity(product), product.base_price))}
            </FlexItem>
          </Flex>
        );
      })}
    </Box>
  ) : null;
}
