import { ChangeEvent, KeyboardEvent, useEffect, useState } from 'react';
import { useB3Lang } from '@b3/lang';
import { Box, Checkbox, FormControlLabel, TextField, Typography } from '@mui/material';

import { PRODUCT_DEFAULT_IMAGE } from '@/constants';
import { useMobile } from '@/hooks';
import { currencyFormat, snackbar } from '@/utils';

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
  setCheckedArr?: (items: number[]) => void;
  setReturnArr?: (items: ReturnListProps[]) => void;
  textAlign?: string;
  type?: string;
}

export default function OrderCheckboxProduct(props: OrderCheckboxProductProps) {
  const {
    products,
    getProductQuantity = (item) => item.editQuantity,
    onProductChange = () => {},
    setCheckedArr = () => {},
    setReturnArr = () => {},
    textAlign = 'left',
    type,
  } = props;

  const b3Lang = useB3Lang();

  const [isMobile] = useMobile();

  const [list, setList] = useState<number[]>([]);

  const [returnList, setReturnList] = useState<ReturnListProps[]>([]);

  const getProductTotals = (quantity: string | number, price: string | number) => {
    const priceNumber = parseFloat(price.toString()) || 0;
    const quantityNumber = parseInt(quantity.toString(), 10) || 0;

    return quantityNumber * priceNumber;
  };

  const itemStyle = isMobile ? mobileItemStyle : defaultItemStyle;

  const handleSelectAllChange = () => {
    const newlist = [...list];
    if (newlist.length === products.length) {
      setList([]);
      setReturnList([]);
    } else {
      const variantIds = products.map((item) => item.variant_id);
      const returnIds: ReturnListProps[] = [];
      products.forEach((item, index) => {
        returnIds[index] = {
          returnId: item.id,
          returnQty: Number(item.editQuantity),
        };
      });

      setList(variantIds);
      setReturnList(returnIds);
    }
  };

  const handleSelectChange = (variantId: number, returnId: number, returnQty: number) => {
    const newlist = [...list];
    const newReturnList = [...returnList];
    const index = newlist.findIndex((item) => item === variantId);
    const returnIndex = newReturnList.findIndex((item) => item.returnId === returnId);
    if (index !== -1) {
      newlist.splice(index, 1);
      newReturnList.splice(returnIndex, 1);
    } else {
      newlist.push(variantId);
      newReturnList.push({
        returnId,
        returnQty,
      });
    }
    setList(newlist);
    setReturnList(newReturnList);
  };

  const isChecked = (variantId: number) => list.includes(variantId);

  const handleProductQuantityChange =
    (product: EditableProductItem) => (e: ChangeEvent<HTMLInputElement>) => {
      const element = product;
      const valueNum = e.target.value;
      if (Number(valueNum) >= 0 && Number(valueNum) <= 1000000) {
        element.editQuantity = valueNum;
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
    setCheckedArr(list);
    // Disabling this line as this dispatcher does not need to be in the dep array
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list]);

  useEffect(() => {
    setReturnArr(returnList);
    // Disabling this line as this dispatcher does not need to be in the dep array
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [returnList]);

  return products.length > 0 ? (
    <Box>
      {!isMobile && (
        <Flex isHeader isMobile={isMobile}>
          <Checkbox checked={list.length === products.length} onChange={handleSelectAllChange} />
          <FlexItem>
            <ProductHead>{b3Lang('orderDetail.reorder.product')}</ProductHead>
          </FlexItem>
          <FlexItem textAlignLocation={textAlign} {...itemStyle.default}>
            <ProductHead>{b3Lang('orderDetail.reorder.price')}</ProductHead>
          </FlexItem>
          <FlexItem textAlignLocation={textAlign} {...itemStyle.default}>
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
            <Checkbox checked={list.length === products.length} onChange={handleSelectAllChange} />
          }
          sx={{
            paddingLeft: '0.6rem',
          }}
        />
      )}

      {products.map((product: EditableProductItem) => (
        <Flex isMobile={isMobile} key={product.sku}>
          <Checkbox
            checked={isChecked(product.variant_id)}
            onChange={() =>
              handleSelectChange(product.variant_id, product.id, Number(product.editQuantity))
            }
          />
          <FlexItem>
            <ProductImage src={product.imageUrl || PRODUCT_DEFAULT_IMAGE} />
            <Box
              sx={{
                marginLeft: '16px',
              }}
            >
              <Typography variant="body1" color="#212121">
                {product.name}
              </Typography>
              <Typography variant="body1" color="#616161">
                {product.sku}
              </Typography>
              {(product.product_options || []).map((option: OrderProductOption) => (
                <ProductOptionText key={option.display_name}>
                  {`${option.display_name}: ${option.display_value}`}
                </ProductOptionText>
              ))}
            </Box>
          </FlexItem>
          <FlexItem textAlignLocation={textAlign} padding="10px 0 0" {...itemStyle.default}>
            {isMobile && <span>{b3Lang('orderDetail.reorder.price')} </span>}
            {`${currencyFormat(product.base_price)}`}
          </FlexItem>
          <FlexItem textAlignLocation={textAlign} {...itemStyle.default}>
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
              error={!!product.helperText}
              helperText={product.helperText}
            />
          </FlexItem>
          <FlexItem textAlignLocation={textAlign} padding="10px 0 0" {...itemStyle.default}>
            {isMobile && <span>{b3Lang('orderDetail.reorder.total')} </span>}
            {`${currencyFormat(getProductTotals(getProductQuantity(product), product.base_price))}`}
          </FlexItem>
        </Flex>
      ))}
    </Box>
  ) : null;
}
