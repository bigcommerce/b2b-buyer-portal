import { Ref, useCallback, useEffect, useId, useImperativeHandle, useState } from 'react';
import { Box, Card, CardContent, Grid, Typography } from '@mui/material';

import { useB3Lang } from '@/lib/lang';
import { useAppSelector } from '@/store';
import { currencyFormat } from '@/utils/b3CurrencyFormat';
import { getBCPrice } from '@/utils/b3Product/b3Product';

import getQuoteDraftShowPriceTBD from '../shared/utils';

interface Summary {
  subtotal: number;
  shipping: number;
  tax: number;
  grandTotal: number;
}

const defaultSummary: Summary = {
  subtotal: 0,
  shipping: 0,
  tax: 0,
  grandTotal: 0,
};

interface QuoteSummaryProps {
  ref?: Ref<unknown>;
}

function QuoteSummary({ ref }: QuoteSummaryProps) {
  const b3Lang = useB3Lang();

  const [quoteSummary, setQuoteSummary] = useState<Summary>({
    ...defaultSummary,
  });

  const [isHideQuoteDraftPrice, setHideQuoteDraftPrice] = useState<boolean>(false);
  const showInclusiveTaxPrice = useAppSelector(({ global }) => global.showInclusiveTaxPrice);
  const draftQuoteList = useAppSelector(({ quoteInfo }) => quoteInfo.draftQuoteList);

  const priceCalc = (price: number) => parseFloat(String(price));

  const getSummary = useCallback(() => {
    const isHidePrice = getQuoteDraftShowPriceTBD(draftQuoteList);

    setHideQuoteDraftPrice(isHidePrice);

    const newQuoteSummary = draftQuoteList.reduce(
      (summary: Summary, product: CustomFieldItems) => {
        const { basePrice, taxPrice: productTax = 0, quantity } = product.node;

        let { subtotal, grandTotal, tax } = summary;

        const { shipping } = summary;

        const price = getBCPrice(Number(basePrice), Number(productTax));

        subtotal += priceCalc(price * quantity);
        tax += priceCalc(Number(productTax) * Number(quantity));

        const totalPrice = showInclusiveTaxPrice ? subtotal : subtotal + tax;

        grandTotal = totalPrice + shipping;

        return {
          grandTotal,
          shipping,
          tax,
          subtotal,
        };
      },
      {
        ...defaultSummary,
      },
    );

    setQuoteSummary(newQuoteSummary);
  }, [showInclusiveTaxPrice, draftQuoteList]);

  useEffect(() => {
    getSummary();
  }, [getSummary]);

  useImperativeHandle(ref, () => ({
    refreshSummary: () => getSummary(),
  }));

  const priceFormat = (price: number) => currencyFormat(price);

  const showPrice = (price: string | number): string | number => {
    if (isHideQuoteDraftPrice) return b3Lang('quoteDraft.quoteSummary.tbd');

    return price;
  };

  const cardId = useId();

  return (
    <Card role="article" aria-labelledby={cardId}>
      <CardContent>
        <Box>
          <Typography id={cardId} variant="h5">
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
              <Typography id="quote-draft-subtotal">
                {b3Lang('quoteDraft.quoteSummary.subTotal')}
              </Typography>
              <Typography aria-labelledby="quote-draft-subtotal">
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
              <Typography id="quote-draft-shipping">
                {b3Lang('quoteDraft.quoteSummary.shipping')}
              </Typography>
              <Typography aria-labelledby="quote-draft-shipping">
                {b3Lang('quoteDraft.quoteSummary.tbd')}
              </Typography>
            </Grid>

            <Grid
              container
              justifyContent="space-between"
              sx={{
                margin: '4px 0',
              }}
            >
              <Typography id="quote-draft-tax">{b3Lang('quoteDraft.quoteSummary.tax')}</Typography>
              <Typography aria-labelledby="quote-draft-tax">
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
                id="quote-draft-grand-total"
                sx={{
                  fontWeight: 'bold',
                }}
              >
                {b3Lang('quoteDraft.quoteSummary.grandTotal')}
              </Typography>
              <Typography
                aria-labelledby="quote-draft-grand-total"
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
  );
}
export default QuoteSummary;
