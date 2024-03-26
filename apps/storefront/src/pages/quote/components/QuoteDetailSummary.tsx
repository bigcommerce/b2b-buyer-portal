import { useB3Lang } from '@b3/lang'
import { Box, Card, CardContent, Grid, Typography } from '@mui/material'

import { useAppSelector } from '@/store'
import { currencyFormatConvert } from '@/utils'

interface Summary {
  originalSubtotal: string | number
  discount: string | number
  tax: string | number
  shipping: string | number
  totalAmount: string | number
}

interface QuoteDetailSummaryProps {
  quoteSummary: Summary
  quoteDetailTax: number
  status: string
  quoteDetail: CustomFieldItems
  isHideQuoteCheckout: boolean
}

export default function QuoteDetailSummary(props: QuoteDetailSummaryProps) {
  const b3Lang = useB3Lang()
  const {
    quoteSummary: { originalSubtotal, discount, tax, shipping, totalAmount },
    quoteDetailTax = 0,
    status,
    quoteDetail,
    isHideQuoteCheckout,
  } = props
  const enteredInclusiveTax = useAppSelector(
    ({ global }) => global.enteredInclusive
  )
  const showInclusiveTaxPrice = useAppSelector(
    ({ global }) => global.showInclusiveTaxPrice
  )

  const subtotalPrice = +originalSubtotal
  const quotedSubtotal = +originalSubtotal - +discount

  const getCurrentPrice = (price: number, quoteDetailTax: number) => {
    if (enteredInclusiveTax) {
      return showInclusiveTaxPrice ? price : price - quoteDetailTax
    }
    return showInclusiveTaxPrice ? price + quoteDetailTax : price
  }

  const priceFormat = (price: number) =>
    `${currencyFormatConvert(price, {
      currency: quoteDetail.currency,
    })}`

  const getShippingAndTax = () => {
    if (quoteDetail?.shippingMethod?.id) {
      return {
        shippingText: `${b3Lang('quoteDetail.summary.shipping')}(${
          quoteDetail?.shippingMethod?.description || ''
        })`,
        shippingVal: priceFormat(+shipping),
        taxText: b3Lang('quoteDetail.summary.tax'),
        taxVal: priceFormat(+tax),
      }
    }

    if (
      !quoteDetail?.salesRepEmail &&
      !quoteDetail?.shippingMethod?.id &&
      +status === 1
    ) {
      return {
        shippingText: b3Lang('quoteDetail.summary.shipping'),
        shippingVal: b3Lang('quoteDetail.summary.tbd'),
        taxText: b3Lang('quoteDetail.summary.estimatedTax'),
        taxVal: priceFormat(+tax),
      }
    }

    if (
      quoteDetail?.salesRepEmail &&
      !quoteDetail?.shippingMethod?.id &&
      (+status === 1 || +status === 5)
    ) {
      return {
        shippingText: `${b3Lang('quoteDetail.summary.shipping')}(${b3Lang(
          'quoteDetail.summary.quoteCheckout'
        )})`,
        shippingVal: b3Lang('quoteDetail.summary.tbd'),
        taxText: b3Lang('quoteDetail.summary.tax'),
        taxVal: b3Lang('quoteDetail.summary.tbd'),
      }
    }

    return null
  }

  const shippingAndTax = getShippingAndTax()

  const showPrice = (price: string | number): string | number => {
    if (isHideQuoteCheckout) return b3Lang('quoteDraft.quoteSummary.tbd')

    return price
  }

  return (
    <Card>
      <CardContent>
        <Box>
          <Typography variant="h5">
            {b3Lang('quoteDetail.summary.quoteSummary')}
          </Typography>
          <Box
            sx={{
              marginTop: '20px',
              color: '#212121',
            }}
          >
            {quoteDetail?.displayDiscount && (
              <Grid
                container
                justifyContent="space-between"
                sx={{
                  margin: '4px 0',
                }}
              >
                <Typography>
                  {b3Lang('quoteDetail.summary.originalSubtotal')}
                </Typography>
                <Typography>
                  {showPrice(
                    priceFormat(getCurrentPrice(subtotalPrice, quoteDetailTax))
                  )}
                </Typography>
              </Grid>
            )}

            {!quoteDetail?.salesRepEmail && +status === 1 ? null : (
              <Grid
                container
                justifyContent="space-between"
                sx={{
                  margin: '4px 0',
                  display: quoteDetail?.displayDiscount ? '' : 'none',
                }}
              >
                <Typography>
                  {b3Lang('quoteDetail.summary.discountAmount')}
                </Typography>
                <Typography>
                  {+discount > 0
                    ? `-${priceFormat(+discount)}`
                    : priceFormat(+discount)}
                </Typography>
              </Grid>
            )}

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
                {b3Lang('quoteDetail.summary.quotedSubtotal')}
              </Typography>
              <Typography
                sx={{
                  fontWeight: 'bold',
                  color: '#212121',
                }}
              >
                {showPrice(
                  priceFormat(getCurrentPrice(quotedSubtotal, quoteDetailTax))
                )}
              </Typography>
            </Grid>

            {shippingAndTax && (
              <>
                <Grid
                  container
                  justifyContent="space-between"
                  sx={{
                    margin: '4px 0',
                  }}
                >
                  <Typography
                    sx={{
                      maxWidth: '70%',
                      wordBreak: 'break-word',
                    }}
                  >
                    {shippingAndTax.shippingText}
                  </Typography>
                  <Typography>
                    {showPrice(shippingAndTax.shippingVal)}
                  </Typography>
                </Grid>
                <Grid
                  container
                  justifyContent="space-between"
                  sx={{
                    margin: '4px 0',
                  }}
                >
                  <Typography>{shippingAndTax.taxText}</Typography>
                  <Typography>{showPrice(shippingAndTax.taxVal)}</Typography>
                </Grid>
              </>
            )}

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
                {b3Lang('quoteDetail.summary.grandTotal')}
              </Typography>
              <Typography
                sx={{
                  fontWeight: 'bold',
                  color: '#212121',
                }}
              >
                {showPrice(priceFormat(+totalAmount))}
              </Typography>
            </Grid>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}
