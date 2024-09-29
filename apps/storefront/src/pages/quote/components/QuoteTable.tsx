import { useState } from 'react';
import { useB3Lang } from '@b3/lang';
import { Delete, Edit } from '@mui/icons-material';
import WarningIcon from '@mui/icons-material/Warning';
import { Box, styled, TextField, Typography } from '@mui/material';
import ceil from 'lodash-es/ceil';

import { TableColumnItem } from '@/components/table/B3Table';
import PaginationTable from '@/components/table/PaginationTable';
import { PRODUCT_DEFAULT_IMAGE } from '@/constants';
import {
  deleteProductFromDraftQuoteList,
  setDraftProduct,
  useAppDispatch,
  useAppSelector,
} from '@/store';
import { Product } from '@/types';
import { QuoteItem } from '@/types/quotes';
import { currencyFormat, snackbar } from '@/utils';
import {
  calculateProductListPrice,
  getBCPrice,
  getDisplayPrice,
  getVariantInfoOOSAndPurchase,
  setModifierQtyPrice,
} from '@/utils/b3Product/b3Product';
import { getProductOptionsFields } from '@/utils/b3Product/shared/config';

import ChooseOptionsDialog from '../../ShoppingListDetails/components/ChooseOptionsDialog';

import QuoteTableCard from './QuoteTableCard';

interface ShoppingDetailTableProps {
  total: number;
  items: any[];
  idEdit?: boolean;
  isB2BUser: boolean;
  updateSummary: () => void;
}

const StyledQuoteTableContainer = styled('div')(() => ({
  backgroundColor: '#FFFFFF',
  padding: '0',
  width: '100%',

  '& tbody': {
    '& tr': {
      '& td': {
        verticalAlign: 'top',
      },
      '& td: first-of-type': {
        verticalAlign: 'inherit',
      },
    },
    '& tr: hover': {
      '& #shoppingList-actionList': {
        opacity: 1,
      },
    },
  },
}));

const StyledImage = styled('img')(() => ({
  maxWidth: '60px',
  height: 'auto',
  marginRight: '0.5rem',
}));

const StyledTextField = styled(TextField)(() => ({
  '& input': {
    paddingTop: '12px',
    paddingRight: '6px',
  },
}));
const QUOTE_PRODUCT_QTY_MAX = 1000000;

function QuoteTable(props: ShoppingDetailTableProps) {
  const { total, items, idEdit = true, isB2BUser, updateSummary } = props;
  const b3Lang = useB3Lang();
  const dispatch = useAppDispatch();
  const [isRequestLoading, setIsRequestLoading] = useState(false);
  const [chooseOptionsOpen, setSelectedOptionsOpen] = useState(false);
  const [optionsProduct, setOptionsProduct] = useState<any>(null);
  const [optionsProductId, setOptionsProductId] = useState<string>('');

  const isEnableProduct = useAppSelector(
    ({ global }) => global.blockPendingQuoteNonPurchasableOOS.isEnableProduct,
  );

  const handleUpdateProductQty = async (row: any, value: number | string) => {
    const product = await setModifierQtyPrice(row, +value);

    dispatch(
      setDraftProduct({
        id: product.id,
        product: {
          node: product,
        },
      }),
    );
    updateSummary();
  };

  const handleCheckProductQty = async (row: any, value: number | string) => {
    let newQty = ceil(+value);
    if (newQty === +value && newQty >= 1 && newQty <= QUOTE_PRODUCT_QTY_MAX) return;

    if (+value < 1) {
      newQty = 1;
    }

    if (+value > QUOTE_PRODUCT_QTY_MAX) {
      newQty = QUOTE_PRODUCT_QTY_MAX;
    }

    handleUpdateProductQty(row, newQty);
  };

  const handleDeleteClick = (id: string) => {
    dispatch(deleteProductFromDraftQuoteList(id));
    updateSummary();
  };

  const handleChooseOptionsDialogCancel = () => {
    setSelectedOptionsOpen(false);
  };

  const handleOpenProductEdit = (product: Product, itemId: string) => {
    setOptionsProduct(product);
    setOptionsProductId(itemId);
    setSelectedOptionsOpen(true);
  };

  const getNewQuoteProduct = (products: Product[]): QuoteItem[] =>
    products.map((product) => {
      const {
        variantId,
        newSelectOptionList,
        id,
        productId,
        name: productName,
        quantity,
        variants = [],
        basePrice,
        taxPrice = 0,
        calculatedNoTaxPrice = 0,
        calculatedTaxPrice = 0,
      } = product;

      let [variantInfo] = variants;
      if (variants.length > 1) {
        variantInfo = variants.find((item) => item.variant_id === variantId) ?? variantInfo;
      }

      const { image_url: primaryImage = '', sku: variantSku } = variantInfo;

      let selectOptions;
      try {
        selectOptions = JSON.stringify(newSelectOptionList);
      } catch (error) {
        selectOptions = '[]';
      }

      const taxExclusive = variantInfo!.bc_calculated_price?.tax_exclusive || 0;
      const taxInclusive = variantInfo!.bc_calculated_price?.tax_inclusive || 0;

      const basePriceExclusiveTax = basePrice || taxExclusive;

      const tax = taxPrice || +taxInclusive - +taxExclusive;

      return {
        node: {
          basePrice: basePriceExclusiveTax,
          taxPrice: tax,
          optionList: selectOptions,
          id: id.toString(),
          primaryImage,
          productId,
          productName,
          productsSearch: {
            ...product,
            selectOptions,
          },
          quantity: +quantity,
          variantSku,
          calculatedTaxPrice,
          calculatedNoTaxPrice,
          calculatedValue: {},
        },
      };
    });

  const handleChooseOptionsDialogConfirm = async (products: Product[]) => {
    await calculateProductListPrice(products);
    const newProducts = getNewQuoteProduct(products);

    newProducts.forEach((product) => {
      const {
        variantSku,
        productsSearch: { variants },
        basePrice,
      } = product.node;
      const newProduct = product;
      const variantItem = variants?.find((item) => item.sku === variantSku);
      if (variantItem) {
        newProduct.node.taxPrice =
          variantItem.bc_calculated_price.tax_inclusive -
          variantItem.bc_calculated_price.tax_exclusive;
      }
      newProduct.node.id = optionsProductId;

      newProduct.node.basePrice = basePrice;
    });

    setSelectedOptionsOpen(false);

    dispatch(setDraftProduct({ id: optionsProductId, product: newProducts[0] }));
    updateSummary();

    snackbar.success(b3Lang('quoteDraft.quoteTable.productUpdated'));
  };

  const columnItems: TableColumnItem<QuoteItem['node']>[] = [
    {
      key: 'Product',
      title: b3Lang('quoteDraft.quoteTable.product'),
      render: (row: CustomFieldItems) => {
        const product: any = {
          ...row.productsSearch,
          selectOptions: row.optionList,
        };
        const productFields = getProductOptionsFields(product, {});

        const optionList = JSON.parse(row.optionList);
        const optionsValue: CustomFieldItems[] = productFields.filter((item) => item.valueText);
        const currentProduct = getVariantInfoOOSAndPurchase(row);
        const inventoryTracking =
          row?.productsSearch?.inventoryTracking || row?.inventoryTracking || 'none';

        let inventoryLevel = row?.productsSearch?.inventoryLevel || row?.inventoryLevel || 0;
        if (inventoryTracking === 'variant') {
          const currentVariant = row?.productsSearch?.variants.find(
            (variant: CustomFieldItems) => variant.sku === row.variantSku,
          );

          inventoryLevel = currentVariant?.inventory_level;
        }

        return (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
            }}
          >
            <StyledImage
              src={row.primaryImage || PRODUCT_DEFAULT_IMAGE}
              alt="Product-img"
              loading="lazy"
            />
            <Box>
              <Typography
                variant="body1"
                color="#212121"
                onClick={() => {
                  const {
                    location: { origin },
                  } = window;

                  if (product?.productUrl) {
                    window.location.href = `${origin}${product?.productUrl}`;
                  }
                }}
                sx={{
                  cursor: 'pointer',
                }}
              >
                {row.productName}
              </Typography>
              <Typography variant="body1" color="#616161">
                {row.variantSku}
              </Typography>
              {optionList.length > 0 && optionsValue.length > 0 && (
                <Box>
                  {optionsValue.map((option: any) => (
                    <Typography
                      sx={{
                        fontSize: '0.75rem',
                        lineHeight: '1.5',
                        color: '#455A64',
                      }}
                      key={option.valueLabel}
                    >
                      {`${option.valueLabel}: ${option.valueText}`}
                    </Typography>
                  ))}
                </Box>
              )}

              {!isEnableProduct && currentProduct?.name && (
                <Box sx={{ color: 'red' }}>
                  <Box
                    sx={{
                      mt: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      '& svg': { mr: '0.5rem' },
                    }}
                  >
                    <WarningIcon color="error" fontSize="small" />
                    {currentProduct?.type === 'oos'
                      ? b3Lang('quoteDraft.quoteTable.outOfStock.tip')
                      : b3Lang('quoteDraft.quoteTable.unavailable.tip')}
                  </Box>
                  {currentProduct?.type === 'oos' && (
                    <Box>
                      {b3Lang('quoteDraft.quoteTable.oosNumber.tip', {
                        qty: inventoryLevel,
                      })}
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          </Box>
        );
      },
      width: '40%',
    },
    {
      key: 'Price',
      title: b3Lang('quoteDraft.quoteTable.price'),
      render: (row: CustomFieldItems) => {
        const { basePrice, taxPrice } = row;

        const inTaxPrice = getBCPrice(+basePrice, +taxPrice);
        return (
          <Typography
            sx={{
              padding: '12px 0',
            }}
          >
            {getDisplayPrice({
              price: `${currencyFormat(inTaxPrice)}`,
              productInfo: row,
              showText: b3Lang('quoteDraft.quoteSummary.tbd'),
            })}
          </Typography>
        );
      },
      width: '15%',
      style: {
        textAlign: 'right',
      },
    },
    {
      key: 'Qty',
      title: b3Lang('quoteDraft.quoteTable.qty'),
      render: (row) => (
        <StyledTextField
          size="small"
          type="number"
          variant="filled"
          disabled={!idEdit}
          value={row.quantity}
          inputProps={{
            inputMode: 'numeric',
            pattern: '[0-9]*',
          }}
          onChange={(e) => {
            handleUpdateProductQty(row, +e.target.value);
          }}
          onBlur={(e) => {
            handleCheckProductQty(row, +e.target.value);
          }}
          sx={{
            width: '75%',
          }}
        />
      ),
      width: '15%',
      style: {
        textAlign: 'right',
      },
    },
    {
      key: 'Total',
      title: b3Lang('quoteDraft.quoteTable.total'),
      render: (row) => {
        const { basePrice, quantity, taxPrice } = row;

        const inTaxPrice = getBCPrice(+basePrice, +taxPrice);
        const total = inTaxPrice * +quantity;
        const optionList = JSON.parse(row.optionList);

        return (
          <Box>
            <Typography
              sx={{
                padding: '12px 0',
              }}
            >
              {getDisplayPrice({
                price: `${currencyFormat(total)}`,
                productInfo: row,
                showText: b3Lang('quoteDraft.quoteSummary.tbd'),
              })}
            </Typography>
            <Box
              sx={{
                marginTop: '1rem',
                opacity: 0,
                textAlign: 'end',
              }}
              id="shoppingList-actionList"
            >
              {optionList.length > 0 && idEdit && (
                <Edit
                  sx={{
                    marginRight: '0.5rem',
                    cursor: 'pointer',
                    color: 'rgba(0, 0, 0, 0.54)',
                  }}
                  onClick={() => {
                    const { productsSearch, id, optionList, quantity } = row;

                    handleOpenProductEdit(
                      {
                        ...productsSearch,
                        quantity,
                        selectOptions: optionList,
                      },
                      id,
                    );
                  }}
                />
              )}
              {idEdit && (
                <Delete
                  sx={{
                    cursor: 'pointer',
                    color: 'rgba(0, 0, 0, 0.54)',
                  }}
                  onClick={() => {
                    const { id } = row;
                    handleDeleteClick(id);
                  }}
                />
              )}
            </Box>
          </Box>
        );
      },
      width: '15%',
      style: {
        textAlign: 'right',
      },
    },
  ];

  return (
    <StyledQuoteTableContainer>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          margin: '0.5rem 0 1rem',
        }}
      >
        <Typography
          sx={{
            fontSize: '24px',
          }}
        >
          {b3Lang('quoteDraft.quoteTable.totalProducts', { total: total || 0 })}
        </Typography>
      </Box>

      <PaginationTable
        columnItems={columnItems}
        rowsPerPageOptions={[12, 24, 36]}
        items={items}
        isCustomRender={false}
        hover
        labelRowsPerPage={b3Lang('quoteDraft.quoteTable.perPage')}
        showBorder={false}
        itemIsMobileSpacing={0}
        noDataText={b3Lang('quoteDraft.quoteTable.noProducts')}
        renderItem={(row: QuoteItem, index?: number) => (
          <QuoteTableCard
            len={total || 0}
            item={row}
            itemIndex={index}
            onEdit={handleOpenProductEdit}
            onDelete={handleDeleteClick}
            handleUpdateProductQty={handleUpdateProductQty}
            idEdit={idEdit}
          />
        )}
      />

      <ChooseOptionsDialog
        isOpen={chooseOptionsOpen}
        isLoading={isRequestLoading}
        setIsLoading={setIsRequestLoading}
        product={optionsProduct}
        onCancel={handleChooseOptionsDialogCancel}
        onConfirm={
          handleChooseOptionsDialogConfirm as unknown as (products: CustomFieldItems[]) => void
        }
        isEdit
        isB2BUser={isB2BUser}
      />
    </StyledQuoteTableContainer>
  );
}

export default QuoteTable;
