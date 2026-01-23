import { ReactElement } from 'react';
import { Delete, Edit, StickyNote2 } from '@mui/icons-material';
import { Box, CardContent, styled, TextField, Typography } from '@mui/material';

import { PRODUCT_DEFAULT_IMAGE } from '@/constants';
import { useB3Lang } from '@/lib/lang';
import b2bGetVariantImageByVariantInfo from '@/utils/b2bGetVariantImageByVariantInfo';
import { currencyFormat } from '@/utils/b3CurrencyFormat';
import { getBCPrice } from '@/utils/b3Product/b3Product';

import { getProductOptionsFields } from '../../../utils/b3Product/shared/config';

interface ShoppingDetailCardProps {
  item: any;
  onEdit: (item: any, variantId: number | string, itemId: number | string) => void;
  onDelete: (itemId: number) => void;
  handleUpdateProductQty: (id: number | string, value: number | string) => void;
  handleUpdateShoppingListItem: (itemId: number | string) => void;
  checkBox?: () => ReactElement;
  isReadForApprove: boolean;
  len: number;
  itemIndex?: number;
  setDeleteOpen: (value: boolean) => void;
  setAddNoteItemId: (itemId: number) => void;
  setAddNoteOpen: (open: boolean) => void;
  setNotes: (value: string) => void;
  showPrice: (price: string, row: CustomFieldItems) => string | number;
  b2bAndBcShoppingListActionsPermissions: boolean;
}

const StyledImage = styled('img')(() => ({
  maxWidth: '60px',
  height: 'auto',
  marginRight: '0.5rem',
}));

function ShoppingDetailCard(props: ShoppingDetailCardProps) {
  const b3Lang = useB3Lang();
  const {
    item: shoppingDetail,
    onEdit,
    onDelete,
    checkBox,
    handleUpdateProductQty,
    handleUpdateShoppingListItem,
    isReadForApprove,
    len,
    itemIndex,
    setDeleteOpen,
    setAddNoteOpen,
    setAddNoteItemId,
    setNotes,
    showPrice,
    b2bAndBcShoppingListActionsPermissions,
  } = props;

  const {
    basePrice,
    quantity,
    itemId,
    variantId,
    primaryImage,
    productName,
    variantSku,
    productsSearch,
    productUrl,
    taxPrice = 0,
    productNote,
  } = shoppingDetail;

  const price = getBCPrice(Number(basePrice), Number(taxPrice));

  const total = price * Number(quantity);

  const product: any = {
    ...shoppingDetail.productsSearch,
    selectOptions: shoppingDetail.optionList,
  };

  const productFields = getProductOptionsFields(product, {});

  const optionList = JSON.parse(shoppingDetail.optionList);
  const optionsValue: CustomFieldItems[] = productFields.filter((item) => item.valueText);

  const canChangeOption =
    optionList.length > 0 && !isReadForApprove && b2bAndBcShoppingListActionsPermissions;

  const currentVariants = product.variants || [];

  const currentImage =
    b2bGetVariantImageByVariantInfo(currentVariants, { variantId, variantSku }) || primaryImage;

  return (
    <Box
      key={shoppingDetail.id}
      sx={{
        borderTop: '1px solid #D9DCE9',
        borderBottom: itemIndex === len - 1 ? '1px solid #D9DCE9' : '',
      }}
    >
      <CardContent
        sx={{
          color: '#313440',
          display: 'flex',
          pl: 0,
        }}
      >
        <Box>{checkBox?.()}</Box>
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
          <Typography
            color="#212121"
            onClick={() => {
              const {
                location: { origin },
              } = window;

              window.location.href = `${origin}${productUrl}`;
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
              margin: '0 0 0.5rem 0',
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

          {productNote && productNote.trim().length > 0 && (
            <Typography
              sx={{
                fontSize: '0.75rem',
                color: '#ED6C02',
                marginTop: '0.3rem',
                marginBottom: '0.3rem',
              }}
            >
              {productNote}
            </Typography>
          )}

          <Typography
            sx={{
              color: '#212121',
              fontSize: '14px',
            }}
          >
            {b3Lang('shoppingList.shoppingDetailCard.price', {
              price: showPrice(currencyFormat(price), shoppingDetail),
            })}
          </Typography>

          <TextField
            disabled={b2bAndBcShoppingListActionsPermissions ? isReadForApprove : true}
            inputProps={{
              inputMode: 'numeric',
              pattern: '[0-9]*',
            }}
            label={b3Lang('shoppingList.shoppingDetailCard.quantity')}
            onBlur={() => {
              handleUpdateShoppingListItem(itemId);
            }}
            onChange={(e) => {
              handleUpdateProductQty(shoppingDetail.id, e.target.value);
            }}
            size="small"
            sx={{
              margin: '0.5rem 0',
              width: '60%',
              maxWidth: '100px',
              '& label': {
                zIndex: 0,
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
          <Typography
            sx={{
              color: '#212121',
              fontSize: '14px',
            }}
          >
            {b3Lang('shoppingList.shoppingDetailCard.total', {
              total: showPrice(currencyFormat(total), shoppingDetail),
            })}
          </Typography>
          <Box
            id="shoppingList-actionList-mobile"
            sx={{
              marginTop: '11px',
              textAlign: 'end',
            }}
          >
            {b2bAndBcShoppingListActionsPermissions && (
              <StickyNote2
                onClick={() => {
                  setAddNoteOpen(true);
                  setAddNoteItemId(Number(itemId));

                  if (productNote) {
                    setNotes(productNote);
                  }
                }}
                sx={{
                  marginRight: '0.5rem',
                  cursor: 'pointer',
                  color: 'rgba(0, 0, 0, 0.54)',
                }}
              />
            )}

            {canChangeOption && (
              <Edit
                onClick={() => {
                  onEdit(
                    {
                      ...productsSearch,
                      selectOptions: optionList,
                      quantity,
                    },
                    variantId,
                    itemId,
                  );
                }}
                sx={{
                  marginRight: canChangeOption ? '0.5rem' : '',
                  marginLeft: canChangeOption ? '0.3rem' : '',
                  cursor: 'pointer',
                  color: 'rgba(0, 0, 0, 0.54)',
                }}
              />
            )}
            {b2bAndBcShoppingListActionsPermissions && !isReadForApprove && (
              <Delete
                onClick={() => {
                  setDeleteOpen(true);
                  onDelete(Number(itemId));
                }}
                sx={{
                  marginLeft: '0.3rem',
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

export default ShoppingDetailCard;
