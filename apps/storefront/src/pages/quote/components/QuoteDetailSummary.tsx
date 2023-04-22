import { Box, Card, CardContent, Grid, Typography } from '@mui/material'

interface Summary {
  originalSubtotal: string | number
  discount: string | number
  tax: string | number
  shipping: string | number
  grandTotal: string | number
}

interface Currency {
  token: string
}

interface QuoteDetailSummaryProps {
  quoteSummary: Summary
  currency: Currency
}

export default function QuoteDetailSummary(props: QuoteDetailSummaryProps) {
  const {
    quoteSummary: { originalSubtotal, discount, tax, shipping, grandTotal },
    currency,
  } = props

  const priceFormat = (price: number) =>
    `${currency?.token || '$'} ${price.toFixed(2)}`
  const quotedSubtotal = +originalSubtotal - +discount

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
              <Typography>{priceFormat(+originalSubtotal + +tax)}</Typography>
            </Grid>
            <Grid
              container
              justifyContent="space-between"
              sx={{
                margin: '4px 0',
              }}
            >
              <Typography>Discount amount</Typography>
              <Typography>{`-${priceFormat(+discount)}`}</Typography>
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
                {priceFormat(+quotedSubtotal + +tax)}
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
                {priceFormat(+grandTotal + +tax)}
              </Typography>
            </Grid>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}
