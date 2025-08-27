import { useB3Lang } from '@b3/lang';
import { Box, CardContent, styled, Typography } from '@mui/material';

import { PRODUCT_DEFAULT_IMAGE } from '@/constants';
import { useAppSelector } from '@/store';
import { currencyFormatConvert } from '@/utils';
import { getBCPrice } from '@/utils/b3Product/b3Product';

interface QuoteTableCardProps {
  item: any;
  len: number;
  getTaxRate: (taxClassId: number, variants: any) => number;
  itemIndex?: number;
  showPrice: (price: string, row: CustomFieldItems) => string | number;
  displayDiscount: boolean;
  currency: CurrencyProps;
}

const StyledImage = styled('img')(() => ({
  maxWidth: '60px',
  height: 'auto',
  marginRight: '0.5rem',
}));

function QuoteDetailTableCard(props: QuoteTableCardProps) {
  const {
    item: quoteTableItem,
    len,
    itemIndex,
    getTaxRate,
    showPrice,
    currency,
    displayDiscount,
  } = props;
  const b3Lang = useB3Lang();
  const enteredInclusiveTax = useAppSelector(
    ({ storeConfigs }) => storeConfigs.currencies.enteredInclusiveTax,
  );

  const {
    basePrice,
    quantity,
    imageUrl,
    productName,
    options,
    sku,
    notes,
    offeredPrice,
    productsSearch: { productUrl, variants = [], taxClassId },
  } = quoteTableItem;

  const taxRate = getTaxRate(taxClassId, variants);
  const taxPrice = enteredInclusiveTax
    ? (Number(basePrice) * taxRate) / (1 + taxRate)
    : Number(basePrice) * taxRate;
  const discountTaxPrice = enteredInclusiveTax
    ? (Number(offeredPrice) * taxRate) / (1 + taxRate)
    : Number(offeredPrice) * taxRate;

  const price = getBCPrice(Number(basePrice), taxPrice);
  const discountPrice = getBCPrice(Number(offeredPrice), discountTaxPrice);

  const isDiscount = Number(basePrice) - Number(offeredPrice) > 0 && displayDiscount;

  const total = Number(price) * Number(quantity);
  const totalWithDiscount = discountPrice * Number(quantity);

  return (
    <Box
      key={quoteTableItem.id}
      sx={{
        borderTop: '1px solid #D9DCE9',
        borderBottom: itemIndex === len - 1 ? '1px solid #D9DCE9' : '',
      }}
      width="100%"
    >
      <CardContent
        sx={{
          color: '#313440',
          display: 'flex',
          pl: 0,
        }}
      >
        <Box>
          <StyledImage alt="Product-img" loading="lazy" src={imageUrl || PRODUCT_DEFAULT_IMAGE} />
        </Box>
        <Box
          sx={{
            flex: 1,
          }}
        >
          <Typography
            color="#212121"
            onClick={() => {
              const {
                location: { origin },
              } = window;

              if (productUrl) {
                window.location.href = `${origin}${productUrl}`;
              }
            }}
            sx={{
              cursor: 'pointer',
            }}
            variant="body1"
          >
            {productName}
          </Typography>
          <Typography color="#616161" variant="body1">
            {sku}
          </Typography>
          <Box
            sx={{
              margin: '1rem 0',
            }}
          >
            {options.length > 0 && (
              <Box>
                {options.map((option: any) => (
                  <Typography
                    key={option.optionName}
                    sx={{
                      fontSize: '0.75rem',
                      lineHeight: '1.5',
                      color: '#455A64',
                    }}
                  >
                    {`${option.optionName}: ${option.optionLabel}`}
                  </Typography>
                ))}
              </Box>
            )}
          </Box>
          <Typography color="#616161" variant="body1">
            {notes}
          </Typography>

          <Typography
            sx={{
              fontSize: '14px',
            }}
          >
            {b3Lang('quoteDetail.tableCard.price')}
            {isDiscount && (
              <span
                style={{
                  marginLeft: '5px',
                  textDecoration: 'line-through',
                }}
              >
                {`${showPrice(
                  currencyFormatConvert(price, {
                    currency,
                  }),
                  quoteTableItem,
                )}`}
              </span>
            )}
            <span
              style={{
                marginLeft: '5px',
                color: isDiscount ? '#2E7D32' : '#212121',
              }}
            >
              {`${showPrice(
                currencyFormatConvert(offeredPrice, {
                  currency,
                }),
                quoteTableItem,
              )}`}
            </span>
          </Typography>

          <Typography
            sx={{
              padding: '12px 0',
              fontSize: '14px',
            }}
          >
            {b3Lang('quoteDetail.tableCard.qty', { quantity })}
          </Typography>

          <Typography
            sx={{
              fontSize: '14px',
            }}
          >
            {b3Lang('quoteDetail.tableCard.total')}
            {isDiscount && (
              <span
                style={{
                  marginLeft: '5px',
                  textDecoration: 'line-through',
                }}
              >
                {`${showPrice(
                  currencyFormatConvert(total, {
                    currency,
                  }),
                  quoteTableItem,
                )}`}
              </span>
            )}
            <span
              style={{
                marginLeft: '5px',
                color: isDiscount ? '#2E7D32' : '#212121',
              }}
            >
              {`${showPrice(
                currencyFormatConvert(totalWithDiscount, {
                  currency,
                }),
                quoteTableItem,
              )}`}
            </span>
          </Typography>
        </Box>
      </CardContent>
    </Box>
  );
}

export default QuoteDetailTableCard;
