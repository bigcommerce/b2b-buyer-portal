import { ChangeEvent, KeyboardEvent, useEffect, useState } from 'react'
import styled from '@emotion/styled'
import {
  Box,
  Checkbox,
  FormControlLabel,
  TextField,
  Typography,
} from '@mui/material'

import { PRODUCT_DEFAULT_IMAGE } from '@/constants'
import { useMobile } from '@/hooks'
import { currencyFormat } from '@/utils'

import { EditableProductItem, OrderProductOption } from '../../../types'

interface OrderCheckboxProductProps {
  products: EditableProductItem[]
  getProductQuantity?: (item: EditableProductItem) => number
  onProductChange?: (products: EditableProductItem[]) => void
  setCheckedArr?: (items: number[]) => void
  textAlign?: string
}

interface FlexProps {
  isHeader?: boolean
  isMobile?: boolean
}

interface FlexItemProps {
  width?: string
  padding?: string
  flexBasis?: string
  minHeight?: string
  textAlignLocation?: string
}

const Flex = styled('div')(({ isHeader, isMobile }: FlexProps) => {
  const headerStyle = isHeader
    ? {
        borderBottom: '1px solid #D9DCE9',
        paddingBottom: '8px',
        alignItems: 'center',
      }
    : {
        alignItems: 'flex-start',
      }

  const mobileStyle = isMobile
    ? {
        borderTop: '1px solid #D9DCE9',
        padding: '12px 0 12px',
        '&:first-of-type': {
          marginTop: '12px',
        },
      }
    : {}

  const flexWrap = isMobile ? 'wrap' : 'initial'

  return {
    display: 'flex',
    wordBreak: 'break-word',
    padding: '8px 0 0',
    gap: '8px',
    flexWrap,
    ...headerStyle,
    ...mobileStyle,
  }
})

const FlexItem = styled('div')(
  ({ width, padding = '0', flexBasis, textAlignLocation }: FlexItemProps) => ({
    display: 'flex',
    flexGrow: width ? 0 : 1,
    flexShrink: width ? 0 : 1,
    alignItems: 'flex-start',
    justifyContent: textAlignLocation === 'right' ? 'flex-end' : 'flex-start',
    flexBasis,
    width,
    padding,
  })
)

const ProductHead = styled('div')(() => ({
  fontSize: '0.875rem',
  lineHeight: '1.5',
  color: '#263238',
}))

const ProductImage = styled('img')(() => ({
  width: '60px',
  borderRadius: '4px',
  flexShrink: 0,
}))

const ProductOptionText = styled('div')(() => ({
  fontSize: '0.75rem',
  lineHeight: '1.5',
  color: '#455A64',
}))

const defaultItemStyle = {
  default: {
    width: '15%',
  },
  qty: {
    width: '80px',
  },
}

const mobileItemStyle = {
  default: {
    width: '100%',
    padding: '0 0 0 128px',
  },
  qty: {
    width: '100%',
    padding: '0 0 0 128px',
  },
}

export default function OrderCheckboxProduct(props: OrderCheckboxProductProps) {
  const {
    products,
    getProductQuantity = (item) => item.editQuantity,
    onProductChange = () => {},
    setCheckedArr = () => {},
    textAlign = 'left',
  } = props

  const [isMobile] = useMobile()

  const [list, setList] = useState<number[]>([])

  const getProductTotals = (
    quantity: string | number,
    price: string | number
  ) => {
    const priceNumber = parseFloat(price.toString()) || 0
    const quantityNumber = parseInt(quantity.toString(), 10) || 0

    return quantityNumber * priceNumber
  }

  const itemStyle = isMobile ? mobileItemStyle : defaultItemStyle

  const handleSelectAllChange = () => {
    const newlist = [...list]
    if (newlist.length === products.length) {
      setList([])
    } else {
      const variantIds = products.map((item) => item.variant_id)
      setList(variantIds)
    }
  }

  const handleSelectChange = (variantId: number) => {
    const newlist = [...list]
    const index = newlist.findIndex((item) => item === variantId)
    if (index !== -1) {
      newlist.splice(index, 1)
    } else {
      newlist.push(variantId)
    }
    setList(newlist)
  }

  const isChecked = (variantId: number) => list.includes(variantId)

  const handleProductQuantityChange =
    (product: EditableProductItem) => (e: ChangeEvent<HTMLInputElement>) => {
      if (!e.target.value || parseInt(e.target.value, 10) > 0) {
        product.editQuantity = e.target.value
        onProductChange([...products])
      }
    }

  const handleNumberInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (['KeyE', 'Equal', 'Minus'].indexOf(event.code) > -1) {
      event.preventDefault()
    }
  }

  const handleNumberInputBlur = (product: EditableProductItem) => () => {
    if (!product.editQuantity) {
      product.editQuantity = '1'
      onProductChange([...products])
    }
  }

  useEffect(() => {
    setCheckedArr(list)
  }, [list])

  return products.length > 0 ? (
    <Box>
      {!isMobile && (
        <Flex isHeader isMobile={isMobile}>
          <Checkbox
            checked={list.length === products.length}
            onChange={handleSelectAllChange}
          />
          <FlexItem>
            <ProductHead>Product</ProductHead>
          </FlexItem>
          <FlexItem textAlignLocation={textAlign} {...itemStyle.default}>
            <ProductHead>Price</ProductHead>
          </FlexItem>
          <FlexItem textAlignLocation={textAlign} {...itemStyle.default}>
            <ProductHead>Qty</ProductHead>
          </FlexItem>
          <FlexItem textAlignLocation={textAlign} {...itemStyle.default}>
            <ProductHead>Total</ProductHead>
          </FlexItem>
        </Flex>
      )}

      {isMobile && (
        <FormControlLabel
          label="Select all products"
          control={
            <Checkbox
              checked={list.length === products.length}
              onChange={handleSelectAllChange}
            />
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
            onChange={() => handleSelectChange(product.variant_id)}
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
              {(product.product_options || []).map(
                (option: OrderProductOption) => (
                  <ProductOptionText key={option.display_name}>
                    {`${option.display_name}: ${option.display_value}`}
                  </ProductOptionText>
                )
              )}
            </Box>
          </FlexItem>
          <FlexItem
            textAlignLocation={textAlign}
            padding="10px 0 0"
            {...itemStyle.default}
          >
            {isMobile && <span>Price: </span>}
            {`${currencyFormat(product.base_price)}`}
          </FlexItem>
          <FlexItem textAlignLocation={textAlign} {...itemStyle.default}>
            <TextField
              type="number"
              variant="filled"
              hiddenLabel={!isMobile}
              label={isMobile ? 'Qty' : ''}
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
          <FlexItem
            textAlignLocation={textAlign}
            padding="10px 0 0"
            {...itemStyle.default}
          >
            {isMobile && <span>Total: </span>}
            {`${currencyFormat(
              getProductTotals(getProductQuantity(product), product.base_price)
            )}`}
          </FlexItem>
        </Flex>
      ))}
    </Box>
  ) : null
}
