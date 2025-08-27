import { useB3Lang } from '@b3/lang';
import { Box, CardContent, styled, TextField, Typography } from '@mui/material';
import { ReactElement } from 'react';

import { PRODUCT_DEFAULT_IMAGE } from '@/constants';
import { currencyFormat, displayFormat } from '@/utils';
import b2bGetVariantImageByVariantInfo from '@/utils/b2bGetVariantImageByVariantInfo';

interface QuickOrderCardProps {
  item: any;
  checkBox?: () => ReactElement;
  handleUpdateProductQty: (id: number, val: string) => void;
}

const StyledImage = styled('img')(() => ({
  maxWidth: '60px',
  height: 'auto',
  marginRight: '0.5rem',
}));

function QuickOrderCard(props: QuickOrderCardProps) {
  const { item: shoppingDetail, checkBox, handleUpdateProductQty } = props;
  const b3Lang = useB3Lang();

  const {
    quantity,
    imageUrl,
    productName,
    variantSku,
    optionList,
    basePrice,
    lastOrderedAt,
    variantId,
    productsSearch,
  } = shoppingDetail;

  const price = Number(basePrice) * Number(quantity);
  const currentVariants = productsSearch.variants || [];
  const currentImage = b2bGetVariantImageByVariantInfo(currentVariants, { variantId }) || imageUrl;

  return (
    <Box
      key={shoppingDetail.id}
      sx={{
        borderTop: '1px solid #D9DCE9',
      }}
    >
      <CardContent
        sx={{
          color: '#313440',
          display: 'flex',
          pl: 0,
        }}
      >
        <Box>{checkBox && checkBox()}</Box>
        <Box>
          <StyledImage
            alt="Product-img"
            loading="lazy"
            src={currentImage || PRODUCT_DEFAULT_IMAGE}
          />
        </Box>
        <Box
          sx={{
            flex: 1,
          }}
        >
          <Typography color="#212121" variant="body1">
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
            {optionList.length > 0 && (
              <Box>
                {optionList.map((option: CustomFieldItems) => (
                  <Typography
                    key={option.display_name}
                    sx={{
                      fontSize: '0.75rem',
                      lineHeight: '1.5',
                      color: '#455A64',
                    }}
                  >
                    {`${option.display_name}: ${option.display_value}`}
                  </Typography>
                ))}
              </Box>
            )}
          </Box>

          <Typography sx={{ fontSize: '14px' }}>
            {b3Lang('purchasedProducts.quickOrderCard.price', {
              price: currencyFormat(price),
            })}
          </Typography>
          <Box
            sx={{
              '& label': {
                zIndex: 0,
              },
            }}
          >
            <TextField
              inputProps={{
                inputMode: 'numeric',
                pattern: '[0-9]*',
              }}
              label="Qty"
              onChange={(e) => {
                handleUpdateProductQty(shoppingDetail.id, e.target.value);
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
          </Box>

          <Typography sx={{ fontSize: '14px' }}>
            {b3Lang('purchasedProducts.quickOrderCard.lastOrdered', {
              lastOrderedAt: displayFormat(lastOrderedAt),
            })}
          </Typography>
        </Box>
      </CardContent>
    </Box>
  );
}

export default QuickOrderCard;
