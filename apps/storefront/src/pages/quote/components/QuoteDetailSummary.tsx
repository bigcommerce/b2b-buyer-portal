import { Box, Card, CardContent, Grid, Typography } from '@mui/material'

import { store } from '@/store'
import { currencyFormat } from '@/utils'

interface Summary {
  originalSubtotal: string | number
  discount: string | number
  tax: string | number
  shipping: string | number
  totalAmount: string | number
}

interface QuoteDetailSummaryProps {
  quoteSummary: Summary
  quoteDetailTaxRate: number
}

export default function QuoteDetailSummary(props: QuoteDetailSummaryProps) {
  const {
    quoteSummary: { originalSubtotal, discount, tax, shipping, totalAmount },
    quoteDetailTaxRate: taxRates = 0,
  } = props

  const {
    global: { showInclusiveTaxPrice },
  } = store.getState()

  const subtotalPrice = +originalSubtotal
  const quotedSubtotal = +originalSubtotal - +discount
  const taxTotal =
    +shipping === 0
      ? +tax
      : +totalAmount + +discount - +shipping - subtotalPrice
  let enteredInclusiveTax = false

  if (+shipping) {
    enteredInclusiveTax = +shipping > taxTotal
  } else {
    enteredInclusiveTax = +totalAmount + +discount === +originalSubtotal
  }

  const getCurrentPrice = (price: number, taxRate: number) => {
    if (enteredInclusiveTax) {
      return showInclusiveTaxPrice ? price : price / (1 + taxRate)
    }
    return showInclusiveTaxPrice ? price * (1 + taxRate) : price
  }

  const priceFormat = (price: number) => `${currencyFormat(price)}`

  return (
    <Card>
      <CardContent>
        <Box>
          <Typography variant="h5">Quote summary</Typography>
          <Box
            sx={{
              marginTop: '20px',
              color: '#212121',
            }}
          >
            <Grid
              container
              justifyContent="space-between"
              sx={{
                margin: '4px 0',
              }}
            >
              <Typography>Original subtotal</Typography>
              <Typography>
                {priceFormat(getCurrentPrice(subtotalPrice, taxRates))}
              </Typography>
            </Grid>
            <Grid
              container
              justifyContent="space-between"
              sx={{
                margin: '4px 0',
              }}
            >
              <Typography>Discount amount</Typography>
              <Typography>
                {+discount > 0
                  ? `-${priceFormat(+discount)}`
                  : priceFormat(+discount)}
              </Typography>
            </Grid>
            <Grid
              container
              justifyContent="space-between"
              sx={{
                margin: '4px 0',
              }}
            >
              <Typography
                sx={{
                  fontWeight: 'bold',
                  color: '#212121',
                }}
              >
                Quoted subtotal
              </Typography>
              <Typography
                sx={{
                  fontWeight: 'bold',
                  color: '#212121',
                }}
              >
                {priceFormat(getCurrentPrice(quotedSubtotal, taxRates))}
              </Typography>
            </Grid>

            <Grid
              container
              justifyContent="space-between"
              sx={{
                margin: '4px 0',
              }}
            >
              <Typography>Shipping</Typography>
              <Typography>{priceFormat(+shipping)}</Typography>
            </Grid>

            <Grid
              container
              justifyContent="space-between"
              sx={{
                margin: '4px 0',
              }}
            >
              <Typography>Tax</Typography>
              <Typography>{priceFormat(+tax)}</Typography>
            </Grid>

            <Grid
              container
              justifyContent="space-between"
              sx={{
                margin: '24px 0 0',
              }}
            >
              <Typography
                sx={{
                  fontWeight: 'bold',
                  color: '#212121',
                }}
              >
                Grand total
              </Typography>
              <Typography
                sx={{
                  fontWeight: 'bold',
                  color: '#212121',
                }}
              >
                {priceFormat(+totalAmount)}
              </Typography>
            </Grid>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}
