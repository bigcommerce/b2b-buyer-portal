import {
  forwardRef,
  Ref,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react'
import { Box, Card, CardContent, Grid, Typography } from '@mui/material'

import { store } from '@/store'
import { B3LStorage, currencyFormat } from '@/utils'
import { getBCPrice } from '@/utils/b3Product/b3Product'

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

const QuoteSummary = forwardRef((_, ref: Ref<unknown>) => {
  const [quoteSummary, setQuoteSummary] = useState<Summary>({
    ...defaultSummary,
  })

  const {
    global: { showInclusiveTaxPrice },
  } = store.getState()

  const priceCalc = (price: number) => parseFloat(String(price))

  const getSummary = () => {
    const productList = B3LStorage.get('b2bQuoteDraftList') || []

    const newQuoteSummary = productList.reduce(
      (summary: Summary, product: CustomFieldItems) => {
        const { basePrice, taxPrice: productTax = 0, quantity } = product.node

        let { subtotal, grandTotal, tax } = summary

        const { shipping } = summary

        const price = getBCPrice(+basePrice, +productTax)

        subtotal += priceCalc(price * quantity)
        tax += priceCalc(+productTax * +quantity)

        const totalPrice = showInclusiveTaxPrice ? subtotal : subtotal + tax

        grandTotal = totalPrice + shipping

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
                {priceFormat(quoteSummary.grandTotal)}
              </Typography>
            </Grid>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
})
export default QuoteSummary
