import {
  ReactElement, useContext,
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

import {
  PRODUCT_DEFAULT_IMAGE,
} from '@/constants'

import {
  CustomStyleContext,
} from '@/shared/customStyleButtton'

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

const QuickOrderCard = (props: QuickOrderCardProps) => {
  const {
    item: shoppingDetail,
    checkBox,
    handleUpdateProductQty,
    currencyToken = '$',
  } = props

  const {
    state: {
      portalStyle: {
        primaryColor = '',
      },
    },
  } = useContext(CustomStyleContext)

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
                '& .MuiFilledInput-input:after': {
                  borderBottom: `2px solid ${primaryColor || '#1976d2'} !important`,
                },
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
