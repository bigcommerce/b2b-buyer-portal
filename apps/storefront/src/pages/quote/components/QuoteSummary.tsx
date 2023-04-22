import {
  forwardRef,
  Ref,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react'
import { Box, Card, CardContent, Grid, Typography } from '@mui/material'

import { B3LStorage } from '@/utils'

interface QuoteSummaryProps {
  currencyToken?: string
}

interface Summary {
  subtotal: number
  shipping: number
  tax: number
  grandTotal: number
}

const defaultSummary: Summary = {
  subtotal: 0,
  shipping: 0,
  tax: 0,
  grandTotal: 0,
}

const QuoteSummary = forwardRef(
  (props: QuoteSummaryProps, ref: Ref<unknown>) => {
    const { currencyToken = '$' } = props

    const [quoteSummary, setQuoteSummary] = useState<Summary>({
      ...defaultSummary,
    })

    const priceCalc = (price: number) => parseFloat(price.toFixed(2))

    const getSummary = () => {
      const productList = B3LStorage.get('b2bQuoteDraftList') || []

      const newQuoteSummary = productList.reduce(
        (summary: Summary, product: CustomFieldItems) => {
          const {
            basePrice,
            tax: productTax,
            quantity,
            additionalCalculatedPrices = [],
          } = product.node

          let { subtotal, grandTotal, tax } = summary

          const { shipping } = summary

          let additionalCalculatedPriceTax = 0

          let additionalCalculatedPrice = 0

          additionalCalculatedPrices.forEach((item: CustomFieldItems) => {
            additionalCalculatedPriceTax += item.additionalCalculatedPriceTax
            additionalCalculatedPrice += item.additionalCalculatedPrice
          })

          subtotal += priceCalc(
            (+basePrice + additionalCalculatedPrice) * quantity
          )
          tax += priceCalc(
            (+productTax + additionalCalculatedPriceTax) * quantity
          )

          grandTotal = subtotal + shipping

          return {
            grandTotal,
            shipping,
            tax,
            subtotal,
          }
        },
        {
          ...defaultSummary,
        }
      )

      setQuoteSummary(newQuoteSummary)
    }

    useEffect(() => {
      getSummary()
    }, [])

    useImperativeHandle(ref, () => ({
      refreshSummary: () => getSummary(),
    }))

    const priceFormat = (price: number) =>
      `${currencyToken} ${price.toFixed(2)}`

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
                <Typography>Sub total</Typography>
                <Typography>
                  {priceFormat(quoteSummary.subtotal + +quoteSummary.tax)}
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
                <Typography
                  sx={{
                    fontWeight: 'bold',
                  }}
                >
                  Grand total
                </Typography>
                <Typography
                  sx={{
                    fontWeight: 'bold',
                  }}
                >
                  {priceFormat(quoteSummary.grandTotal + +quoteSummary.tax)}
                </Typography>
              </Grid>
            </Box>
          </Box>
        </CardContent>
      </Card>
    )
  }
)
export default QuoteSummary
