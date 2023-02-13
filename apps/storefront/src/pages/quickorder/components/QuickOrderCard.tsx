import {
  ReactElement,
} from 'react'

import {
  Box,
  CardContent,
  Typography,
  styled,
} from '@mui/material'

import {
  getProductOptionsFields,
} from '../../shoppingListDetails/shared/config'

interface QuickOrderCardProps {
  item: any,
  currencyToken: string,
  checkBox?: () => ReactElement,
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
    currencyToken = '$',
  } = props

  const {
    basePrice,
    quantity,
    primaryImage,
    productName,
    variantSku,
  } = shoppingDetail

  const total = +basePrice * +quantity
  const price = +basePrice

  const product: any = {
    ...shoppingDetail.productsSearch,
    selectOptions: shoppingDetail.optionList,
  }

  const productFields = (getProductOptionsFields(product, {}))

  const optionList = JSON.parse(shoppingDetail.optionList)
  const optionsValue: CustomFieldItems[] = productFields.filter((item) => item.valueText)

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
            src={primaryImage || defaultProductImage}
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

          <Typography>{`qty: ${quantity}`}</Typography>

          <Typography>{`Total: ${currencyToken}${total.toFixed(2)}`}</Typography>
        </Box>
      </CardContent>
    </Box>
  )
}

export default QuickOrderCard
