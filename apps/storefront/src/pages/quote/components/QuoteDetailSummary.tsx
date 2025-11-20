import { Box, Card, CardContent, Grid, Typography } from '@mui/material';

import { useB3Lang } from '@/lib/lang';
import { useAppSelector } from '@/store';
import { currencyFormatConvert } from '@/utils/b3CurrencyFormat';

interface Summary {
  originalSubtotal: string | number;
  discount: string | number;
  tax: string | number;
  shipping: string | number;
  totalAmount: string | number;
}

interface QuoteDetailSummaryProps {
  quoteSummary: Summary;
  quoteDetailTax: number;
  status: string;
  quoteDetail: CustomFieldItems;
  isHideQuoteCheckout: boolean;
}

export default function QuoteDetailSummary({
  quoteSummary: { originalSubtotal, discount, tax, shipping, totalAmount },
  quoteDetailTax = 0,
  status,
  quoteDetail,
  isHideQuoteCheckout,
}: QuoteDetailSummaryProps) {
  const b3Lang = useB3Lang();
  const enteredInclusiveTax = useAppSelector(
    ({ storeConfigs }) => storeConfigs.currencies.enteredInclusiveTax,
  );
  const showInclusiveTaxPrice = useAppSelector(({ global }) => global.showInclusiveTaxPrice);

  const getCurrentPrice = (price: number, quoteDetailTax: number) => {
    if (enteredInclusiveTax) {
      return showInclusiveTaxPrice ? price : price - quoteDetailTax;
    }
    return showInclusiveTaxPrice ? price + quoteDetailTax : price;
  };

  const priceFormat = (price: number) =>
    currencyFormatConvert(price, {
      currency: quoteDetail.currency,
      isConversionRate: false,
      useCurrentCurrency: !!quoteDetail.currency,
    });

  const getShippingAndTax = () => {
    if (quoteDetail?.shippingMethod?.id) {
      return {
        shippingText: `${b3Lang('quoteDetail.summary.shipping')}(${
          quoteDetail?.shippingMethod?.description || ''
        })`,
        shippingVal: priceFormat(Number(shipping)),
        taxText: b3Lang('quoteDetail.summary.tax'),
        taxVal: priceFormat(Number(tax)),
      };
    }

    if (!quoteDetail?.salesRepEmail && !quoteDetail?.shippingMethod?.id && Number(status) === 1) {
      return {
        shippingText: b3Lang('quoteDetail.summary.shipping'),
        shippingVal: b3Lang('quoteDetail.summary.tbd'),
        taxText: b3Lang('quoteDetail.summary.estimatedTax'),
        taxVal: priceFormat(Number(tax)),
      };
    }

    if (
      quoteDetail?.salesRepEmail &&
      !quoteDetail?.shippingMethod?.id &&
      (Number(status) === 1 || Number(status) === 5)
    ) {
      return {
        shippingText: `${b3Lang('quoteDetail.summary.shipping')}(${b3Lang(
          'quoteDetail.summary.quoteCheckout',
        )})`,
        shippingVal: b3Lang('quoteDetail.summary.tbd'),
        taxText: b3Lang('quoteDetail.summary.tax'),
        taxVal: b3Lang('quoteDetail.summary.tbd'),
      };
    }

    return null;
  };

  const shippingAndTax = getShippingAndTax();

  const showPrice = (price: string | number): string | number => {
    if (isHideQuoteCheckout) return b3Lang('quoteDraft.quoteSummary.tbd');

    return price;
  };

  const subtotalPrice = Number(originalSubtotal);
  const quotedSubtotal = Number(originalSubtotal) - Number(discount);
  return (
    <Card>
      <CardContent>
        <Box>
          <Typography variant="h5">{b3Lang('quoteDetail.summary.quoteSummary')}</Typography>
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
                <Typography>{b3Lang('quoteDetail.summary.originalSubtotal')}</Typography>
                <Typography>
                  {showPrice(priceFormat(getCurrentPrice(subtotalPrice, quoteDetailTax)))}
                </Typography>
              </Grid>
            )}

            {!quoteDetail?.salesRepEmail && Number(status) === 1 ? null : (
              <Grid
                container
                justifyContent="space-between"
                sx={{
                  margin: '4px 0',
                  display: quoteDetail?.displayDiscount ? '' : 'none',
                }}
              >
                <Typography>{b3Lang('quoteDetail.summary.discountAmount')}</Typography>
                <Typography>
                  {Number(discount) > 0
                    ? `-${priceFormat(Number(discount))}`
                    : priceFormat(Number(discount))}
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
                {showPrice(priceFormat(getCurrentPrice(quotedSubtotal, quoteDetailTax)))}
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
                  <Typography>{showPrice(shippingAndTax.shippingVal)}</Typography>
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
                {showPrice(priceFormat(Number(totalAmount)))}
              </Typography>
            </Grid>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
