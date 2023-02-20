import {
  ReactElement,
  ChangeEvent,
  KeyboardEvent,
  useState,
  useEffect,
} from 'react'

import {
  Box,
  Typography,
  TextField,
  Checkbox,
  FormControlLabel,
} from '@mui/material'

import styled from '@emotion/styled'

import {
  noop,
} from 'lodash'

import {
  PRODUCT_DEFAULT_IMAGE,
} from '@/constants'

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
    color: '#212121',
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
}: FlexItemProps) => ({
  display: 'flex',
  flexGrow: width ? 0 : 1,
  flexShrink: width ? 0 : 1,
  alignItems: 'center',
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
    width: '15%',
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
  onProductQuantityChange?: (id: number, newQuantity: number) => void,
  showCheckbox?: boolean,
  setCheckedArr?: (items: Array<T & ProductItem>) => void
  selectAllText?: string,
  totalText?: string,
  canToProduct?: boolean,
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
    showCheckbox = false,
    setCheckedArr = noop,
    selectAllText = 'Select all products',
    totalText = 'Total',
    canToProduct = false,
  } = props

  const [list, setList] = useState<ProductItem[]>([])

  const [isMobile] = useMobile()

  const getProductPrice = (price: string | number) => {
    const priceNumber = parseFloat(price.toString()) || 0

    return priceNumber.toFixed(2)
  }

  const getQuantity = (product: any) => parseInt(product[quantityKey]?.toString() || '', 10) || ''

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

  const handleSelectAllChange = () => {
    const newList = [...list]
    if (newList.length === products.length) {
      setList([])
    } else {
      setList([...products])
    }
  }

  const handleSelectChange = (product: ProductItem) => {
    const newList = [...list]
    const index = newList.findIndex((item) => item.id === product.id)
    if (index !== -1) {
      newList.splice(index, 1)
    } else {
      newList.push(product)
    }
    setList(newList)
  }

  const isChecked = (product: ProductItem) => list.findIndex((item) => item.id === product.id) !== -1

  useEffect(() => {
    setCheckedArr(list)
  }, [list])

  useEffect(() => {
    setList([])
  }, [products])

  const itemStyle = isMobile ? mobileItemStyle : defaultItemStyle

  return products.length > 0 ? (
    <Box>
      {
        !isMobile && (
        <Flex
          isHeader
          isMobile={isMobile}
        >
          {
            showCheckbox && (
            <Checkbox
              checked={list.length === products.length}
              onChange={handleSelectAllChange}
            />
            )
          }
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
            <ProductHead>{totalText}</ProductHead>
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
        isMobile && showCheckbox && (
          <FormControlLabel
            label={selectAllText}
            control={(
              <Checkbox
                checked={list.length === products.length}
                onChange={handleSelectAllChange}
              />
            )}
            sx={{
              paddingLeft: '0.6rem',
            }}
          />
        )
      }

      {
        products.map((product) => (
          <Flex
            isMobile={isMobile}
            key={product.id}
          >
            {
              showCheckbox && (
                <Checkbox
                  checked={isChecked(product)}
                  onChange={() => handleSelectChange(product)}
                />
              )
            }
            <FlexItem>
              <ProductImage src={product.imageUrl || PRODUCT_DEFAULT_IMAGE} />
              <Box
                sx={{
                  marginLeft: '16px',
                }}
              >
                <Typography
                  variant="body1"
                  color="#212121"
                  onClick={() => {
                    if (canToProduct) {
                      const {
                        location: {
                          origin,
                        },
                      } = window

                      if (product?.productUrl) window.location.href = `${origin}${product?.productUrl}`
                    }
                  }}
                  sx={{
                    cursor: 'pointer',
                  }}
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
              padding={quantityEditable ? '10px 0 0' : ''}
              {...itemStyle.default}
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
                        width: '60%',
                        '& .MuiFormHelperText-root': {
                          marginLeft: '0',
                          marginRight: '0',
                        },
                      }}
                      error={!!product.helperText}
                      helperText={product.helperText}
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
              padding={quantityEditable ? '10px 0 0' : ''}
              {...itemStyle.default}
            >
              {isMobile && (
              <span>
                {totalText}
                :
              </span>
              )}
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
