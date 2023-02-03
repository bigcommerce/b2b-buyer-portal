import {
  Box,
  CardContent,
  Typography,
  styled,
} from '@mui/material'

interface QuoteTableCardProps {
  item: any,
  currencyToken?: string,
  len: number,
  itemIndex?: number,
}

const StyledImage = styled('img')(() => ({
  maxWidth: '60px',
  height: 'auto',
  marginRight: '0.5rem',
}))

const defaultProductImage = 'https://cdn11.bigcommerce.com/s-1i6zpxpe3g/stencil/cd9e3830-4c73-0139-8a51-0242ac11000a/e/4fe76590-73f1-0139-3767-32e4ea84ca1d/img/ProductDefault.gif'

const QuoteDetailTableCard = (props: QuoteTableCardProps) => {
  const {
    item: quoteTableItem,
    currencyToken = '$',
    len,
    itemIndex,
  } = props

  const {
    basePrice,
    quantity,
    imageUrl,
    productName,
    options,
    sku,
    notes,
    offeredPrice,
  } = quoteTableItem

  const price = +basePrice
  const discountPrice = +offeredPrice
  const isDiscount = price - discountPrice > 0

  const total = price * +quantity
  const totalWithDiscount = discountPrice * +quantity

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
            src={imageUrl || defaultProductImage}
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
          >
            {productName}
          </Typography>
          <Typography
            variant="body1"
            color="#616161"
          >
            {sku}
          </Typography>
          <Box
            sx={{
              margin: '1rem 0',
            }}
          >
            {
              (options.length > 0) && (
                <Box>
                  {
                    options.map((option: any) => (
                      <Typography
                        sx={{
                          fontSize: '0.75rem',
                          lineHeight: '1.5',
                          color: '#455A64',
                        }}
                        key={option.optionName}
                      >
                        {`${option.optionName
                        }: ${option.optionLabel
                        }`}
                      </Typography>
                    ))
                  }
                </Box>
              )
            }
          </Box>
          <Typography
            variant="body1"
            color="#616161"
          >
            {notes}
          </Typography>

          <Typography>
            Price:
            {
              isDiscount && (
                <span style={{
                  marginLeft: '5px',
                  textDecoration: 'line-through',
                }}
                >
                  {`${currencyToken}${price.toFixed(2)}`}
                </span>
              )
            }
            <span style={{
              marginLeft: '5px',
              color: isDiscount ? '#2E7D32' : '#212121',
            }}
            >
              {`${currencyToken}${offeredPrice.toFixed(2)}`}
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
            {
              isDiscount && (
                <span style={{
                  marginLeft: '5px',
                  textDecoration: 'line-through',
                }}
                >
                  {`${currencyToken}${total.toFixed(2)}`}
                </span>
              )
            }
            <span style={{
              marginLeft: '5px',
              color: isDiscount ? '#2E7D32' : '#212121',
            }}
            >
              {`${currencyToken}${totalWithDiscount.toFixed(2)}`}
            </span>
          </Typography>
        </Box>
      </CardContent>
    </Box>
  )
}

export default QuoteDetailTableCard
