import {
  Box,
  Typography,
  Checkbox,
  TextField,
} from '@mui/material'

import {
  useState,
} from 'react'

import styled from '@emotion/styled'

import {
  useMobile,
} from '@/hooks'

import {
  OrderProductItem,
  OrderProductOption,
} from '../shared/B2BOrderData'

interface OrderCheckboxProductProps {
  products: any[],
  currency?: string,
  getProductQuantity?: (item: OrderProductItem) => number
}

interface FlexProps {
  isHeader?: boolean,
  isMobile?: boolean,
}

interface FlexItemProps {
  width?: string,
  padding?: string,
  flexBasis?: string,
}

const Flex = styled('div')(({
  isHeader,
  isMobile,
}: FlexProps) => {
  const headerStyle = isHeader ? {
    borderBottom: '1px solid #D9DCE9',
    paddingBottom: '8px',
    alignItems: 'center',
  } : {
    alignItems: 'flex-start',
  }

  const mobileStyle = isMobile ? {
    borderTop: '1px solid #D9DCE9',
    padding: '12px 0 12px',
    '&:first-of-type': {
      marginTop: '12px',
    },
  } : {}

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

const FlexItem = styled('div')(({
  width,
  padding = '0',
  flexBasis,
}: FlexItemProps) => ({
  display: 'flex',
  flexGrow: width ? 0 : 1,
  flexShrink: width ? 0 : 1,
  alignItems: 'flex-start',
  flexBasis,
  width,
  padding,
}))

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
    width: '100px',
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

export const OrderCheckboxProduct = (props: OrderCheckboxProductProps) => {
  const {
    products,
    currency = '$',
    getProductQuantity = (item) => item.quantity,
  } = props

  const [isMobile] = useMobile()

  const [list, setList] = useState<any>([])

  const getProductPrice = (price: string | number) => {
    const priceNumber = parseFloat(price.toString()) || 0

    return priceNumber.toFixed(2)
  }

  const getProductTotals = (quantity: number, price: string | number) => {
    const priceNumber = parseFloat(price.toString()) || 0

    return (quantity * priceNumber).toFixed(2)
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

  const handleSelectChange = (variantId: any) => {
    const newlist = [...list]
    const index = newlist.findIndex((item) => item === variantId)
    if (index !== -1) {
      newlist.splice(index, 1)
    } else {
      newlist.push(variantId)
    }
    setList(newlist)
  }

  const isChecked = (variantId: any) => list.includes(variantId)

  return products.length > 0 ? (
    <Box>
      {
        !isMobile && (
        <Flex
          isHeader
          isMobile={isMobile}
        >
          <Checkbox
            checked={list.length === products.length}
            onChange={handleSelectAllChange}
          />
          <FlexItem flexBasis="100px">
            <ProductHead>Product</ProductHead>
          </FlexItem>
          <FlexItem {...itemStyle.default}>
            <ProductHead>Price</ProductHead>
          </FlexItem>
          <FlexItem {...itemStyle.qty}>
            <ProductHead>Qty</ProductHead>
          </FlexItem>
          <FlexItem {...itemStyle.default}>
            <ProductHead>Cost</ProductHead>
          </FlexItem>
        </Flex>
        )
      }
      {/*
      {
        isMobile && (

        )
      } */}

      {
        products.map((product: OrderProductItem) => (
          <Flex isMobile={isMobile}>
            <Checkbox
              checked={isChecked(product.variant_id)}
              onChange={() => handleSelectChange(product.variant_id)}
            />
            <FlexItem flexBasis="100px">
              <ProductImage src={product.imageUrl} />
              <Box
                sx={{
                  marginLeft: '16px',
                }}
              >
                <Typography
                  variant="body1"
                  color="#212121"
                >
                  {product.name}
                </Typography>
                <Typography
                  variant="body1"
                  color="#616161"
                >
                  {product.sku}
                </Typography>
                {(product.product_options || []).map((option: OrderProductOption) => (
                  <ProductOptionText>{`${option.display_name}: ${option.display_value}`}</ProductOptionText>
                ))}
              </Box>
            </FlexItem>
            <FlexItem {...itemStyle.default}>
              {isMobile && <span>Price:</span>}
              {`${currency} ${getProductPrice(product.base_price)}`}
            </FlexItem>
            <FlexItem {...itemStyle.qty}>
              <TextField
                type="number"
                variant={isMobile ? 'filled' : 'outlined'}
                label={isMobile ? 'Qty' : ''}
                value={getProductQuantity(product)}
                size="small"
                sx={{
                  width: isMobile ? '60%' : '100%',
                }}
              />
            </FlexItem>
            <FlexItem {...itemStyle.default}>
              {isMobile && <span>Cost:</span>}
              {`${currency} ${getProductTotals(getProductQuantity(product), product.base_price)}`}
            </FlexItem>
          </Flex>
        ))
      }
    </Box>
  ) : <></>
}
