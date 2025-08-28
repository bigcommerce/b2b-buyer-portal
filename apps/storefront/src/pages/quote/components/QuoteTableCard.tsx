import { Delete, Edit } from '@mui/icons-material';
import { Box, CardContent, styled, TextField, Typography } from '@mui/material';

import { PRODUCT_DEFAULT_IMAGE } from '@/constants';
import { useB3Lang } from '@/lib/lang';
import { currencyFormat } from '@/utils';
import { getBCPrice, getDisplayPrice } from '@/utils/b3Product/b3Product';

import { getProductOptionsFields } from '../../../utils/b3Product/shared/config';

interface QuoteTableCardProps {
  item: any;
  onEdit: (item: any, itemId: string) => void;
  onDelete: (id: string) => void;
  handleUpdateProductQty: (id: number | string, value: number | string) => void;
  idEdit: boolean;
  len: number;
  itemIndex?: number;
}

const StyledImage = styled('img')(() => ({
  maxWidth: '60px',
  height: 'auto',
  marginRight: '0.5rem',
}));

function QuoteTableCard(props: QuoteTableCardProps) {
  const {
    item: quoteTableItem,
    onEdit,
    onDelete,
    handleUpdateProductQty,
    idEdit,
    len,
    itemIndex,
  } = props;

  const {
    basePrice,
    quantity,
    id,
    primaryImage,
    productName,
    variantSku,
    productsSearch,
    taxPrice = 0,
  } = quoteTableItem;

  const b3Lang = useB3Lang();

  const price = getBCPrice(Number(basePrice), Number(taxPrice));

  const total = price * Number(quantity);

  const product: any = {
    ...quoteTableItem.productsSearch,
    selectOptions: quoteTableItem.optionList,
  };

  const productFields = getProductOptionsFields(product, {});

  const optionList = JSON.parse(quoteTableItem.optionList);
  const optionsValue: CustomFieldItems[] = productFields.filter((item) => item.valueText);

  const { productUrl } = productsSearch;

  const singlePrice = getDisplayPrice({
    price: currencyFormat(price),
    productInfo: quoteTableItem,
    showText: b3Lang('quoteDraft.quoteSummary.tbd'),
  });

  const totalPrice = getDisplayPrice({
    price: currencyFormat(total),
    productInfo: quoteTableItem,
    showText: b3Lang('quoteDraft.quoteSummary.tbd'),
  });

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
          <StyledImage
            alt="Product-img"
            loading="lazy"
            src={primaryImage || PRODUCT_DEFAULT_IMAGE}
          />
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
            {variantSku}
          </Typography>
          <Box
            sx={{
              margin: '1rem 0',
            }}
          >
            {optionList.length > 0 && optionsValue.length > 0 && (
              <Box>
                {optionsValue.map((option: any) => (
                  <Typography
                    key={option.valueLabel}
                    sx={{
                      fontSize: '0.75rem',
                      lineHeight: '1.5',
                      color: '#455A64',
                    }}
                  >
                    {`${option.valueLabel}: ${option.valueText}`}
                  </Typography>
                ))}
              </Box>
            )}
          </Box>

          <Typography sx={{ fontSize: '14px' }}>{`Price: ${singlePrice}`}</Typography>

          <TextField
            disabled={!idEdit}
            inputProps={{
              inputMode: 'numeric',
              pattern: '[0-9]*',
            }}
            label="qty"
            onChange={(e) => {
              handleUpdateProductQty(quoteTableItem, e.target.value);
            }}
            size="small"
            sx={{
              margin: '1rem 0',
              width: '60%',
              maxWidth: '100px',
              '& label': {
                fontSize: '14px',
              },
              '& input': {
                fontSize: '14px',
              },
            }}
            type="number"
            value={quantity}
            variant="filled"
          />
          <Typography sx={{ fontSize: '14px' }}>{`Total: ${totalPrice}`}</Typography>
          <Box
            id="shoppingList-actionList-mobile"
            sx={{
              marginTop: '1rem',
              textAlign: 'end',
            }}
          >
            {optionList.length > 0 && idEdit && (
              <Edit
                onClick={() => {
                  onEdit(
                    {
                      ...productsSearch,
                      quantity,
                      selectOptions: quoteTableItem.optionList,
                    },
                    id,
                  );
                }}
                sx={{
                  marginRight: '0.5rem',
                  cursor: 'pointer',
                  color: 'rgba(0, 0, 0, 0.54)',
                }}
              />
            )}
            {idEdit && (
              <Delete
                onClick={() => {
                  onDelete(id);
                }}
                sx={{
                  cursor: 'pointer',
                  color: 'rgba(0, 0, 0, 0.54)',
                }}
              />
            )}
          </Box>
        </Box>
      </CardContent>
    </Box>
  );
}

export default QuoteTableCard;
