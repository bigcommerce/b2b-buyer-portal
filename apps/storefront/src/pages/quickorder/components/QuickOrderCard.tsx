import {
  ReactElement,
} from 'react'

import {
  Box,
  CardContent,
  Typography,
  styled,
  TextField,
} from '@mui/material'

import {
  format,
} from 'date-fns'

interface QuickOrderCardProps {
  item: any,
  currencyToken: string,
  checkBox?: () => ReactElement,
  handleUpdateProductQty: (id: number, val: string) => void
}

const StyledImage = styled('img')(() => ({
  maxWidth: '60px',
  height: 'auto',
  marginRight: '0.5rem',
}))

const defaultProductImage = 'https://cdn11.bigcommerce.com/s-1i6zpxpe3g/stencil/cd9e3830-4c73-0139-8a51-0242ac11000a/e/4fe76590-73f1-0139-3767-32e4ea84ca1d/img/ProductDefault.gif'

const QuickOrderCard = (props: QuickOrderCardProps) => {
  const {
    item: shoppingDetail,
    checkBox,
    handleUpdateProductQty,
    currencyToken = '$',
  } = props

  const {
    quantity,
    imageUrl,
    productName,
    variantSku,
    optionList,
    basePrice,
    lastOrderedAt,
  } = shoppingDetail

  const price = +basePrice * +quantity
  return (
    <Box
      key={shoppingDetail.id}
      sx={{
        borderTop: '1px solid #D9DCE9',
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
          {
            checkBox && checkBox()
          }
        </Box>
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
            {variantSku}
          </Typography>
          <Box
            sx={{
              margin: '1rem 0',
            }}
          >
            {
              (optionList.length > 0) && (
                <Box>
                  {
                    optionList.map((option: CustomFieldItems) => (
                      <Typography
                        sx={{
                          fontSize: '0.75rem',
                          lineHeight: '1.5',
                          color: '#455A64',
                        }}
                        key={option.display_name}
                      >
                        {`${option.display_name
                        }: ${option.display_value}`}
                      </Typography>
                    ))
                  }
                </Box>
              )
            }
          </Box>

          <Typography>{`Price: ${currencyToken}${price.toFixed(2)}`}</Typography>

          <Box
            sx={{
              '& label': {
                zIndex: 0,
              },
            }}
          >
            <TextField
              size="small"
              type="number"
              variant="filled"
              label="Qty"
              inputProps={{
                inputMode: 'numeric', pattern: '[0-9]*',
              }}
              value={quantity}
              sx={{
                margin: '1rem 0',
                width: '60%',
                maxWidth: '100px',
              }}
              onChange={(e) => {
                handleUpdateProductQty(shoppingDetail.id, e.target.value)
              }}
            />
          </Box>

          <Typography>{`Last ordered: ${format(lastOrderedAt * 1000, 'dd MMM yyyy')}`}</Typography>
        </Box>
      </CardContent>
    </Box>
  )
}

export default QuickOrderCard
