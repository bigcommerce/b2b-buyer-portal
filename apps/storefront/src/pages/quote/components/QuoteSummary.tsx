import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
} from '@mui/material'

import {
  useState,
  useEffect,
} from 'react'

import {
  B3LStorage,
} from '@/utils'

interface QuoteSummaryProps {
  isRefresh: boolean,
  currencyToken?: string,
}

interface Summary {
  subtotal: number,
  shipping: number,
  tax: number,
  grandTotal: number,
}

const defaultSummary: Summary = {
  subtotal: 0,
  shipping: 0,
  tax: 0,
  grandTotal: 0,
}

export const QuoteSummary = (props: QuoteSummaryProps) => {
  const {
    isRefresh,
    currencyToken = '$',
  } = props

  const [quoteSummary, setQuoteSummary] = useState<Summary>({
    ...defaultSummary,
  })

  const priceCalc = (price: number) => parseFloat(price.toFixed(2))

  const getSummary = () => {
    const productList = B3LStorage.get('b2bQuoteDraftList') || []

    const newQuoteSummary = productList.reduce((summary: Summary, product: CustomFieldItems) => {
      const {
        basePrice,
        tax: productTax,
        quantity,
        additionalCalculatedPriceTax = 0,
      } = product.node

      let {
        subtotal,
        grandTotal,
        tax,
      } = summary

      const {
        shipping,
      } = summary

      subtotal += priceCalc(basePrice * quantity)
      tax += priceCalc((productTax + additionalCalculatedPriceTax) * quantity)

      grandTotal = subtotal + shipping

      return {
        grandTotal,
        shipping,
        tax,
        subtotal,
      }
    }, {
      ...defaultSummary,
    })

    setQuoteSummary(newQuoteSummary)
  }

  useEffect(() => {
    getSummary()
  }, [])

  useEffect(() => {
    if (isRefresh) {
      getSummary()
    }
  }, [isRefresh])

  const priceFormat = (price: number) => `${currencyToken} ${price.toFixed(2)}`

  return (
    <Card>
      <CardContent>
        <Box>
          <Typography variant="h5">Quote summary</Typography>
          <Box sx={{
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
              <Typography>Sub total</Typography>
              <Typography>{priceFormat(quoteSummary.subtotal)}</Typography>
            </Grid>

            <Grid
              container
              justifyContent="space-between"
              sx={{
                margin: '4px 0',
              }}
            >
              <Typography>Shipping</Typography>
              <Typography>{priceFormat(quoteSummary.shipping)}</Typography>
            </Grid>

            <Grid
              container
              justifyContent="space-between"
              sx={{
                margin: '4px 0',
              }}
            >
              <Typography>Tax</Typography>
              <Typography>{priceFormat(quoteSummary.tax)}</Typography>
            </Grid>

            <Grid
              container
              justifyContent="space-between"
              sx={{
                margin: '24px 0 0',
              }}
            >
              <Typography sx={{
                fontWeight: 'bold',
              }}
              >
                Grand total
              </Typography>
              <Typography sx={{
                fontWeight: 'bold',
              }}
              >
                {priceFormat(quoteSummary.grandTotal)}
              </Typography>
            </Grid>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}
