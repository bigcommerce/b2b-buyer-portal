import {
  ReactElement,
} from 'react'

import {
  Box,
  Card,
  CardContent,
  Typography,
  styled,
  TextField,
} from '@mui/material'
import {
  Delete,
  Edit,
} from '@mui/icons-material'

interface ShoppingDetailCardProps {
  item: any,
  onEdit: (item: any, variantId: number | string, itemId: number | string) => void,
  onDelete: (itemId: number) => void,
  currencyToken: string,
  handleUpdateProductQty: (id: number | string, value: number | string) => void,
  handleUpdateShoppingListItem: (itemId: number | string) => void,
  checkBox?: () => ReactElement,
}

const StyledImage = styled('img')(() => ({
  maxWidth: '60px',
  height: 'auto',
  marginRight: '0.5rem',
}))

const defaultProductImage = 'https://cdn11.bigcommerce.com/s-1i6zpxpe3g/stencil/cd9e3830-4c73-0139-8a51-0242ac11000a/e/4fe76590-73f1-0139-3767-32e4ea84ca1d/img/ProductDefault.gif'

const ShoppingDetailCard = (props: ShoppingDetailCardProps) => {
  const {
    item: shoppingDetail,
    onEdit,
    onDelete,
    checkBox,
    currencyToken = '$',
    handleUpdateProductQty,
    handleUpdateShoppingListItem,
  } = props

  const {
    basePrice,
    quantity,
    itemId,
    variantId,
    primaryImage,
    productsSearch: {
      variants,
    },
    productName,
    variantSku,
    productsSearch,
  } = shoppingDetail

  const total = +basePrice * +quantity
  const price = +basePrice
  const optionList = JSON.parse(shoppingDetail.optionList)
  let optionsValue
  if (optionList.length > 0) {
    const variant = variants.find((item: any) => item.id === variantId)

    optionsValue = variant?.option_values || []
  }

  return (
    <Card
      key={shoppingDetail.id}
    >
      <CardContent
        sx={{
          color: '#313440',
          display: 'flex',
        }}
      >
        <Box>
          {
            checkBox && checkBox()
          }
        </Box>
        <Box>
          <StyledImage
            src={primaryImage || defaultProductImage}
            alt="Product-img"
            loading="lazy"
          />
        </Box>
        <Box>
          <Typography>{productName}</Typography>
          <Typography>{variantSku}</Typography>
          <Box
            sx={{
              margin: '1rem 0',
            }}
          >
            {
              (optionList.length > 0 && optionsValue.length > 0) && (
                <Box>
                  {
                    optionsValue.map((option: any) => (
                      <Typography key={option.option_display_name}>
                        {`${option.option_display_name
                        }: ${option.label}`}
                      </Typography>
                    ))
                  }
                </Box>
              )
            }
          </Box>

          <Typography>{`Price: ${currencyToken}${price.toFixed(2)}`}</Typography>

          <TextField
            size="small"
            type="number"
            value={quantity}
            sx={{
              margin: '1rem 0',
            }}
            onChange={(e) => {
              handleUpdateProductQty(shoppingDetail.id, e.target.value)
            }}
            onBlur={() => {
              handleUpdateShoppingListItem(itemId)
            }}
          />
          <Typography>{`Total: ${currencyToken}${total.toFixed(2)}`}</Typography>
          <Box
            sx={{
              marginTop: '1rem',
              textAlign: 'end',
            }}
            id="shoppingList-actionList-mobile"
          >
            {
              optionList.length > 0 && (
                <Edit
                  sx={{
                    marginRight: '0.5rem',
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    onEdit(productsSearch, variantId, itemId)
                  }}
                />
              )
            }
            <Delete
              sx={{
                cursor: 'pointer',
              }}
              onClick={() => {
                onDelete(+itemId)
              }}
            />
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

export default ShoppingDetailCard
