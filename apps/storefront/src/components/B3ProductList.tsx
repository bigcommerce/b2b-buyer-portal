import {
  ReactElement,
  ChangeEvent,
  KeyboardEvent,
} from 'react'

import {
  Box,
  Typography,
  TextField,
} from '@mui/material'

import styled from '@emotion/styled'

import {
  noop,
} from 'lodash'
import {
  useMobile,
} from '@/hooks'

import {
  ProductItem,
} from '../types'

interface FlexProps {
  isHeader?: boolean,
  isMobile?: boolean,
}

interface FlexItemProps {
  width?: string,
  padding?: string,
  sx?: {
    [k: string]: string
  }
}

const Flex = styled('div')(({
  isHeader,
  isMobile,
}: FlexProps) => {
  const headerStyle = isHeader ? {
    borderBottom: '1px solid #D9DCE9',
    paddingBottom: '8px',
  } : {}

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
    alignItems: ' flex-start',
    ...headerStyle,
    ...mobileStyle,
  }
})

const FlexItem = styled('div')(({
  width,
  padding = '0',
  sx = {},
}: FlexItemProps) => ({
  display: 'flex',
  flexGrow: width ? 0 : 1,
  flexShrink: width ? 0 : 1,
  alignItems: 'center',
  width,
  padding,
  ...sx,
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
    padding: '0 0 0 76px',
  },
  qty: {
    width: '100%',
    padding: '0 0 0 76px',
  },
}

interface ProductProps <T> {
  products: Array<T & ProductItem>,
  currency?: string,
  renderAction?: (item: T & ProductItem) => ReactElement,
  actionWidth?: string,
  quantityKey?: string,
  quantityEditable?: boolean,
  onProductQuantityChange?: (id: number, newQuantity: number) => void
}

export const B3ProductList: <T>(props: ProductProps<T>) => ReactElement = (props) => {
  const {
    products,
    currency = '$',
    renderAction,
    quantityKey = 'quantity',
    actionWidth = '100px',
    quantityEditable = false,
    onProductQuantityChange = noop,
  } = props

  const [isMobile] = useMobile()

  const getProductPrice = (price: string | number) => {
    const priceNumber = parseFloat(price.toString()) || 0

    return priceNumber.toFixed(2)
  }

  const getQuantity = (product: any) => parseInt(product[quantityKey].toString(), 10) || ''

  const getProductTotals = (quantity: number, price: string | number) => {
    const priceNumber = parseFloat(price.toString()) || 0

    return (quantity * priceNumber).toFixed(2)
  }

  const handleProductQuantityChange = (id: number) => (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value || parseInt(e.target.value, 10) > 0) {
      onProductQuantityChange(id, e.target.value)
    }
  }

  const handleNumberInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (['KeyE', 'Equal', 'Minus'].indexOf(event.code) > -1) {
      event.preventDefault()
    }
  }

  const handleNumberInputBlur = (product: any) => () => {
    if (!product[quantityKey]) {
      onProductQuantityChange(product.id, 1)
    }
  }

  const itemStyle = isMobile ? mobileItemStyle : defaultItemStyle

  return products.length > 0 ? (
    <Box>
      {
        !isMobile && (
        <Flex
          isHeader
          isMobile={isMobile}
        >
          <FlexItem>
            <ProductHead>Product</ProductHead>
          </FlexItem>
          <FlexItem {...itemStyle.default}>
            <ProductHead>Price</ProductHead>
          </FlexItem>
          <FlexItem {...itemStyle.qty}>
            <ProductHead>Qty</ProductHead>
          </FlexItem>
          <FlexItem {...itemStyle.default}>
            <ProductHead>Total</ProductHead>
          </FlexItem>
          {
            renderAction && (
            <FlexItem
              {...itemStyle.default}
              width={isMobile ? '100%' : actionWidth}
            />
            )
          }
        </Flex>
        )
      }

      {
        products.map((product) => (
          <Flex
            isMobile={isMobile}
            key={product.id}
          >
            <FlexItem>
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
                {(product.product_options || []).map((option) => (
                  <ProductOptionText key={`${option.option_id}`}>{`${option.display_name}: ${option.display_value}`}</ProductOptionText>
                ))}
              </Box>
            </FlexItem>

            <FlexItem
              {...itemStyle.default}
              sx={{
                minHeight: '40px',
              }}
            >
              {isMobile && <span>Price:</span>}
              {`${currency} ${getProductPrice(product.base_price)}`}
            </FlexItem>

            <FlexItem {...itemStyle.qty}>
              {
                quantityEditable ? (
                  <>
                    <TextField
                      type="number"
                      variant="filled"
                      hiddenLabel={!isMobile}
                      label={isMobile ? 'Qty' : ''}
                      value={getQuantity(product)}
                      onChange={handleProductQuantityChange(product.id)}
                      onKeyDown={handleNumberInputKeyDown}
                      onBlur={handleNumberInputBlur(product)}
                      size="small"
                      sx={{
                        width: isMobile ? '60%' : '100%',
                      }}
                    />
                  </>
                ) : (
                  <>
                    {isMobile && <span>Qty:</span>}
                    {getQuantity(product)}
                  </>
                )
              }
            </FlexItem>

            <FlexItem
              {...itemStyle.default}
              sx={{
                minHeight: '40px',
              }}
            >
              {isMobile && <span>Total:</span>}
              {`${currency} ${getProductTotals(getQuantity(product) || 0, product.base_price)}`}
            </FlexItem>

            { renderAction && (
              <FlexItem
                {...itemStyle.default}
                width={isMobile ? '100%' : actionWidth}
              >
                <>
                  { renderAction(product) }
                </>
              </FlexItem>
            )}
          </Flex>
        ))
      }
    </Box>
  ) : <></>
}
