import { useState } from 'react';
import { Delete, Edit, Warning as WarningIcon } from '@mui/icons-material';
import { Box, styled, TextField, Typography } from '@mui/material';
import ceil from 'lodash-es/ceil';

import { TableColumnItem } from '@/components/table/B3Table';
import PaginationTable from '@/components/table/PaginationTable';
import { PRODUCT_DEFAULT_IMAGE } from '@/constants';
import { useIsBackorderEnabled } from '@/hooks/useIsBackorderEnabled';
import { LangFormatFunction, useB3Lang } from '@/lib/lang';
import { deleteProductFromDraftQuoteList, setDraftProduct, useAppDispatch } from '@/store';
import { Product } from '@/types';
import { QuoteItem } from '@/types/quotes';
import { currencyFormat } from '@/utils/b3CurrencyFormat';
import {
  calculateProductListPrice,
  getBCPrice,
  getDisplayPrice,
  getVariantInfoOOSAndPurchase,
  setModifierQtyPrice,
} from '@/utils/b3Product/b3Product';
import { getProductOptionsFields } from '@/utils/b3Product/shared/config';
import { snackbar } from '@/utils/b3Tip';

import ChooseOptionsDialog from '../../ShoppingListDetails/components/ChooseOptionsDialog';

import QuoteTableCard from './QuoteTableCard';

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

type ProductOptionsValue = {
  valueLabel: string;
  valueText: string;
};

function getProductOptionsValues({ productsSearch, optionList: selectOptions }: QuoteItem['node']) {
  const productFields = getProductOptionsFields(
    { ...productsSearch, selectOptions },
    {},
  ) as ProductOptionsValue[];

  const optionList = JSON.parse(selectOptions);

  return optionList.length > 0 ? productFields.filter((item) => item.valueText) : [];
}

type AvailabilityWarnings = { warningMessage: string | null; warningDetails: string | null };

function getAvailabilityWarningsFrontend(
  row: QuoteItem['node'],
  b3Lang: LangFormatFunction,
): AvailabilityWarnings {
  const product = {
    ...row.productsSearch,
    selectOptions: row.optionList,
  };

  let warningMessage: string | null = null;
  let warningDetails: string | null = null;
  const currentProduct = getVariantInfoOOSAndPurchase(row);
  const showWarning = currentProduct?.name;

  if (showWarning) {
    if (currentProduct?.type === 'oos') {
      const inventoryTracking = product.inventoryTracking || row.inventoryTracking || 'none';

      let inventoryLevel = product.inventoryLevel || row.inventoryLevel || 0;
      if (inventoryTracking === 'variant' && product.variants) {
        const currentVariant = product.variants.find(({ sku }) => sku === row.variantSku);

        inventoryLevel = currentVariant?.inventory_level ?? 0;
      }

      warningMessage = b3Lang('quoteDraft.quoteTable.outOfStock.tip');
      warningDetails = b3Lang('quoteDraft.quoteTable.oosNumber.tip', {
        qty: inventoryLevel,
      });
    } else {
      warningMessage = b3Lang('quoteDraft.quoteTable.unavailable.tip');
    }
  }

  return { warningMessage, warningDetails };
}

function getAvailabilityWarningsBackend(
  row: QuoteItem['node'],
  b3Lang: LangFormatFunction,
): AvailabilityWarnings {
  const product = {
    ...row.productsSearch,
    selectOptions: row.optionList,
  };

  let warningMessage: string | null = null;
  let warningDetails: string | null = null;

  if (product.inventoryTracking !== 'none') {
    let hasUnlimitedBackorder = product.unlimitedBackorder;
    let availableStock = product.availableToSell;

    if (product.inventoryTracking === 'variant' && product.variants) {
      const currentVariant = product.variants.find(({ sku }) => sku === row.variantSku);
      if (currentVariant) {
        hasUnlimitedBackorder = currentVariant.unlimited_backorder;
        availableStock = currentVariant.available_to_sell;
      }
    }

    if (!hasUnlimitedBackorder && availableStock < row.quantity) {
      warningMessage = b3Lang('quoteDraft.quoteTable.outOfStock.tip');
      warningDetails = b3Lang('quoteDraft.quoteTable.oosNumber.tip', {
        qty: availableStock,
      });
    }
  }

  return { warningMessage, warningDetails };
}

const getThresholdWarning = (row: QuoteItem['node'], b3Lang: LangFormatFunction): string | null => {
  const minQuantity = Number(row.productsSearch?.orderQuantityMinimum || 0);
  const maxQuantity = Number(row.productsSearch?.orderQuantityMaximum || 0);
  const quantity = Number(row.quantity || 0);
  const sku = row.variantSku || row.productsSearch?.sku || '';

  if (minQuantity > 0 && quantity < minQuantity) {
    return b3Lang('purchasedProducts.quickOrderPad.minQuantityMessage', {
      minQuantity,
      sku,
    });
  }
  if (maxQuantity > 0 && quantity > maxQuantity) {
    return b3Lang('purchasedProducts.quickOrderPad.maxQuantityMessage', {
      maxQuantity,
      sku,
    });
  }

  return null;
};

interface QuoteTableProps {
  total: number;
  items: QuoteItem[];
  updateSummary: () => void;
}

function QuoteTable({ total, items, updateSummary }: QuoteTableProps) {
  const b3Lang = useB3Lang();
  const dispatch = useAppDispatch();
  const isBackorderEnabled = useIsBackorderEnabled();

  const [isRequestLoading, setIsRequestLoading] = useState(false);
  const [chooseOptionsOpen, setSelectedOptionsOpen] = useState(false);
  const [optionsProduct, setOptionsProduct] = useState<Product>();
  const [optionsProductId, setOptionsProductId] = useState<string>('');

  const handleUpdateProductQty = async (row: QuoteItem['node'], quantity: number) => {
    const product = await setModifierQtyPrice(row, quantity);

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

  const handleCheckProductQty = async (item: QuoteItem['node'], quantity: number) => {
    let newQty = ceil(quantity);
    if (newQty === Number(quantity) && newQty >= 1 && newQty <= QUOTE_PRODUCT_QTY_MAX) return;

    if (quantity < 1) {
      newQty = 1;
    }

    if (quantity > QUOTE_PRODUCT_QTY_MAX) {
      newQty = QUOTE_PRODUCT_QTY_MAX;
    }

    handleUpdateProductQty(item, newQty);
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
      const basePriceExclusiveTax = basePrice || taxExclusive;

      return {
        node: {
          basePrice: basePriceExclusiveTax,
          taxPrice,
          optionList: selectOptions,
          id: id.toString(),
          primaryImage,
          productId,
          productName,
          productsSearch: {
            ...product,
            selectOptions,
          },
          quantity: Number(quantity),
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
      const { basePrice } = product.node;
      const newProduct = product;
      newProduct.node.id = optionsProductId;

      newProduct.node.basePrice = basePrice;
    });

    setSelectedOptionsOpen(false);

    dispatch(setDraftProduct({ id: optionsProductId, product: newProducts[0] }));
    updateSummary();

    snackbar.success(b3Lang('quoteDraft.quoteTable.productUpdated'));
  };

  const getAvailabilityWarnings = isBackorderEnabled
    ? getAvailabilityWarningsBackend
    : getAvailabilityWarningsFrontend;

  const columnItems: TableColumnItem<QuoteItem['node']>[] = [
    {
      key: 'Product',
      title: b3Lang('quoteDraft.quoteTable.product'),
      render: (row) => {
        const availabilityWarning = getAvailabilityWarnings(row, b3Lang);
        const thresholdWarning = getThresholdWarning(row, b3Lang);
        const warningMessage = availabilityWarning.warningMessage
          ? availabilityWarning.warningMessage
          : thresholdWarning;
        const productOptionsValues = getProductOptionsValues(row);
        const productUrl = row.productsSearch?.productUrl;

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
                  if (productUrl) {
                    window.location.href = `${window.location.origin}${productUrl}`;
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
              {productOptionsValues.length > 0 && (
                <Box>
                  {productOptionsValues.map((option: any) => (
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

              {warningMessage && (
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
                    {warningMessage}
                  </Box>
                  {availabilityWarning.warningDetails && (
                    <Box>{availabilityWarning.warningDetails}</Box>
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

        const inTaxPrice = getBCPrice(Number(basePrice), Number(taxPrice));
        return (
          <Typography
            sx={{
              padding: '12px 0',
            }}
          >
            {getDisplayPrice({
              price: currencyFormat(inTaxPrice),
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
          value={row.quantity}
          inputProps={{
            inputMode: 'numeric',
            pattern: '[0-9]*',
          }}
          onChange={(e) => {
            handleUpdateProductQty(row, Number(e.target.value));
          }}
          onBlur={(e) => {
            handleCheckProductQty(row, Number(e.target.value));
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

        const inTaxPrice = getBCPrice(Number(basePrice), Number(taxPrice));
        const total = inTaxPrice * Number(quantity);
        const optionList = JSON.parse(row.optionList);

        return (
          <Box>
            <Typography
              sx={{
                padding: '12px 0',
              }}
            >
              {getDisplayPrice({
                price: currencyFormat(total),
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
              {optionList.length > 0 && (
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
              <Delete
                sx={{ cursor: 'pointer', color: 'rgba(0, 0, 0, 0.54)' }}
                onClick={() => {
                  handleDeleteClick(row.id);
                }}
              />{' '}
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
        renderItem={(row, index = 0) => (
          <QuoteTableCard
            item={row}
            isLast={index === total - 1}
            onEdit={handleOpenProductEdit}
            onDelete={handleDeleteClick}
            handleUpdateProductQty={handleUpdateProductQty}
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
      />
    </StyledQuoteTableContainer>
  );
}

export default QuoteTable;
