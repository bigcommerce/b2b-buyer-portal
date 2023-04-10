import {
  Box,
  CardContent,
  Typography,
  styled,
  TextField,
} from '@mui/material'
import {
  Delete,
  Edit,
} from '@mui/icons-material'

import {
  PRODUCT_DEFAULT_IMAGE,
} from '@/constants'

import {
  getProductOptionsFields,
} from '../../shoppingListDetails/shared/config'

interface QuoteTableCardProps {
  item: any,
  onEdit: (item: any, itemId: number | string) => void,
  onDelete: (id: string) => void,
  currencyToken?: string,
  handleUpdateProductQty: (id: number | string, value: number | string) => void,
  idEdit: boolean,
  len: number,
  itemIndex?: number,
}

const StyledImage = styled('img')(() => ({
  maxWidth: '60px',
  height: 'auto',
  marginRight: '0.5rem',
}))

const QuoteTableCard = (props: QuoteTableCardProps) => {
  const {
    item: quoteTableItem,
    onEdit,
    onDelete,
    currencyToken = '$',
    handleUpdateProductQty,
    idEdit,
    len,
    itemIndex,
  } = props

  const {
    // basePrice,
    quantity,
    id,
    primaryImage,
    productName,
    variantSku,
    productsSearch,
    productsSearch: {
      variants,
    },
    variantId,
  } = quoteTableItem

  const currentVariantInfo = variants.find((item: CustomFieldItems) => +item.variant_id === +variantId || variantSku === item.sku) || {}
  const bcCalculatedPrice: {
    tax_inclusive: number | string,
  } = currentVariantInfo.bc_calculated_price
  const withTaxPrice = +bcCalculatedPrice.tax_inclusive
  const total = +withTaxPrice * +quantity
  const price = +withTaxPrice

  const product: any = {
    ...quoteTableItem.productsSearch,
    selectOptions: quoteTableItem.optionList,
  }

  const productFields = (getProductOptionsFields(product, {}))

  const optionList = JSON.parse(quoteTableItem.optionList)
  const optionsValue: CustomFieldItems[] = productFields.filter((item) => item.valueText)

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
            src={primaryImage || PRODUCT_DEFAULT_IMAGE}
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
              (optionList.length > 0 && optionsValue.length > 0) && (
                <Box>
                  {
                    optionsValue.map((option: any) => (
                      <Typography
                        sx={{
                          fontSize: '0.75rem',
                          lineHeight: '1.5',
                          color: '#455A64',
                        }}
                        key={option.valueLabel}
                      >
                        {`${option.valueLabel
                        }: ${option.valueText}`}
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
            variant="filled"
            label="qty"
            disabled={!idEdit}
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
              handleUpdateProductQty(id, e.target.value)
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
              optionList.length > 0 && idEdit && (
                <Edit
                  sx={{
                    marginRight: '0.5rem',
                    cursor: 'pointer',
                    color: 'rgba(0, 0, 0, 0.54)',
                  }}
                  onClick={() => {
                    onEdit({
                      ...productsSearch,
                      quantity,
                      selectOptions: quoteTableItem.optionList,
                    }, id)
                  }}
                />
              )
            }
            {
              idEdit && (
              <Delete
                sx={{
                  cursor: 'pointer',
                  color: 'rgba(0, 0, 0, 0.54)',
                }}
                onClick={() => {
                  onDelete(id)
                }}
              />
              )
            }

          </Box>
        </Box>
      </CardContent>
    </Box>
  )
}

export default QuoteTableCard
