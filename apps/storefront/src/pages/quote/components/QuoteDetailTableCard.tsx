import { Box, CardContent, styled, Typography } from '@mui/material'

import { PRODUCT_DEFAULT_IMAGE } from '@/constants'
import { currencyFormat } from '@/utils'

interface QuoteTableCardProps {
  item: any
  len: number
  itemIndex?: number
}

const StyledImage = styled('img')(() => ({
  maxWidth: '60px',
  height: 'auto',
  marginRight: '0.5rem',
}))

function QuoteDetailTableCard(props: QuoteTableCardProps) {
  const { item: quoteTableItem, len, itemIndex } = props

  const {
    basePrice,
    quantity,
    imageUrl,
    productName,
    options,
    sku,
    notes,
    offeredPrice,
    productsSearch: { productUrl },
  } = quoteTableItem

  const price = +basePrice
  const isDiscount = +basePrice - +offeredPrice > 0

  const total = +price * +quantity
  const totalWithDiscount = +offeredPrice * +quantity

  return (
    <Box
      key={quoteTableItem.id}
      width="100%"
      sx={{
        borderTop: '1px solid #D9DCE9',
        borderBottom: itemIndex === len - 1 ? '1px solid #D9DCE9' : '',
      }}
    >
      <CardContent
        sx={{
          color: '#313440',
          display: 'flex',
          pl: 0,
        }}
      >
        <Box>
          <StyledImage
            src={imageUrl || PRODUCT_DEFAULT_IMAGE}
            alt="Product-img"
            loading="lazy"
          />
        </Box>
        <Box
          sx={{
            flex: 1,
          }}
        >
          <Typography
            variant="body1"
            color="#212121"
            onClick={() => {
              const {
                location: { origin },
              } = window

              if (productUrl) {
                window.location.href = `${origin}${productUrl}`
              }
            }}
            sx={{
              cursor: 'pointer',
            }}
          >
            {productName}
          </Typography>
          <Typography variant="body1" color="#616161">
            {sku}
          </Typography>
          <Box
            sx={{
              margin: '1rem 0',
            }}
          >
            {options.length > 0 && (
              <Box>
                {options.map((option: any) => (
                  <Typography
                    sx={{
                      fontSize: '0.75rem',
                      lineHeight: '1.5',
                      color: '#455A64',
                    }}
                    key={option.optionName}
                  >
                    {`${option.optionName}: ${option.optionLabel}`}
                  </Typography>
                ))}
              </Box>
            )}
          </Box>
          <Typography variant="body1" color="#616161">
            {notes}
          </Typography>

          <Typography>
            Price:
            {isDiscount && (
              <span
                style={{
                  marginLeft: '5px',
                  textDecoration: 'line-through',
                }}
              >
                {`${currencyFormat(price)}`}
              </span>
            )}
            <span
              style={{
                marginLeft: '5px',
                color: isDiscount ? '#2E7D32' : '#212121',
              }}
            >
              {`${currencyFormat(+offeredPrice)}`}
            </span>
          </Typography>

          <Typography
            sx={{
              padding: '12px 0',
            }}
          >
            {`Qty: ${quantity}`}
          </Typography>

          <Typography>
            Total:
            {isDiscount && (
              <span
                style={{
                  marginLeft: '5px',
                  textDecoration: 'line-through',
                }}
              >
                {`${currencyFormat(total)}`}
              </span>
            )}
            <span
              style={{
                marginLeft: '5px',
                color: isDiscount ? '#2E7D32' : '#212121',
              }}
            >
              {`${currencyFormat(totalWithDiscount)}`}
            </span>
          </Typography>
        </Box>
      </CardContent>
    </Box>
  )
}

export default QuoteDetailTableCard
