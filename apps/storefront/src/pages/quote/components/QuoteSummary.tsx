import {
  forwardRef,
  Ref,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react'
import { useB3Lang } from '@b3/lang'
import { Box, Card, CardContent, Grid, Typography } from '@mui/material'

import { useAppSelector } from '@/store'
import { B3LStorage, currencyFormat } from '@/utils'
import { getBCPrice } from '@/utils/b3Product/b3Product'

import getQuoteDraftShowPriceTBD from '../shared/utils'

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
  const b3Lang = useB3Lang()

  const [quoteSummary, setQuoteSummary] = useState<Summary>({
    ...defaultSummary,
  })

  const [isHideQuoteDraftPrice, setHideQuoteDraftPrice] =
    useState<boolean>(false)
  const showInclusiveTaxPrice = useAppSelector(
    ({ global }) => global.showInclusiveTaxPrice
  )

  const priceCalc = (price: number) => parseFloat(String(price))

  const getSummary = useCallback(() => {
    const productList = B3LStorage.get('b2bQuoteDraftList') || []

    const isHidePrice = getQuoteDraftShowPriceTBD(productList)

    setHideQuoteDraftPrice(isHidePrice)

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
  }, [showInclusiveTaxPrice])

  useEffect(() => {
    getSummary()
  }, [getSummary])

  useImperativeHandle(ref, () => ({
    refreshSummary: () => getSummary(),
  }))

  const priceFormat = (price: number) => `${currencyFormat(price)}`

  const showPrice = (price: string | number): string | number => {
    if (isHideQuoteDraftPrice) return b3Lang('quoteDraft.quoteSummary.tbd')

    return price
  }

  return (
    <Card>
      <CardContent>
        <Box>
          <Typography variant="h5">
            {b3Lang('quoteDraft.quoteSummary.summary')}
          </Typography>
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
              <Typography>
                {b3Lang('quoteDraft.quoteSummary.subTotal')}
              </Typography>
              <Typography>
                {showPrice(priceFormat(quoteSummary.subtotal))}
              </Typography>
            </Grid>

            <Grid
              container
              justifyContent="space-between"
              sx={{
                margin: '4px 0',
              }}
            >
              <Typography>
                {b3Lang('quoteDraft.quoteSummary.shipping')}
              </Typography>
              <Typography>{b3Lang('quoteDraft.quoteSummary.tbd')}</Typography>
            </Grid>

            <Grid
              container
              justifyContent="space-between"
              sx={{
                margin: '4px 0',
              }}
            >
              <Typography>{b3Lang('quoteDraft.quoteSummary.tax')}</Typography>
              <Typography>
                {showPrice(priceFormat(quoteSummary.tax))}
              </Typography>
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
                {b3Lang('quoteDraft.quoteSummary.grandTotal')}
              </Typography>
              <Typography
                sx={{
                  fontWeight: 'bold',
                }}
              >
                {showPrice(priceFormat(quoteSummary.grandTotal))}
              </Typography>
            </Grid>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
})
export default QuoteSummary
