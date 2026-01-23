import { forwardRef, Ref, useImperativeHandle, useRef, useState } from 'react';
import { Box, styled, Typography } from '@mui/material';

import { B3PaginationTable, GetRequestList } from '@/components/table/B3PaginationTable';
import { TableColumnItem } from '@/components/table/B3Table';
import { PRODUCT_DEFAULT_IMAGE } from '@/constants';
import { useB3Lang } from '@/lib/lang';
import { useAppSelector } from '@/store';
import { currencyFormatConvert } from '@/utils/b3CurrencyFormat';
import { getBCPrice, getDisplayPrice } from '@/utils/b3Product/b3Product';

import QuoteDetailTableCard from './QuoteDetailTableCard';

interface ProductInfoProps {
  basePrice: number | string;
  baseSku: string;
  createdAt: number;
  discount: number | string;
  enteredInclusive: boolean;
  id: number | string;
  itemId: number;
  optionList: string;
  primaryImage: string;
  productId: number;
  productName: string;
  productUrl: string;
  quantity: number | string;
  tax: number | string;
  updatedAt: number;
  variantId: number;
  variantSku: string;
  productsSearch: CustomFieldItems;
  offeredPrice: number | string;
}

interface ListItemProps {
  node: ProductInfoProps;
}

interface ShoppingDetailTableProps {
  total: number;
  getQuoteTableDetails: GetRequestList<SearchProps, ProductInfoProps>;
  quoteReviewedBySalesRep: boolean;
  getTaxRate: (taxClassId: number, variants: any) => number;
  displayDiscount: boolean;
  currency: CurrencyProps;
}

interface SearchProps {
  first?: number;
  offset?: number;
}

interface OptionProps {
  optionId: number;
  optionLabel: string;
  optionName: string;
  optionValue: string | number;
}

interface PaginationTableRefProps extends HTMLInputElement {
  getList: () => void;
  setList: (items?: ListItemProps[]) => void;
  getSelectedValue: () => void;
}

const StyledQuoteTableContainer = styled('div')(() => ({
  backgroundColor: '#FFFFFF',
  padding: '1rem',
  width: '100%',
  border: '1px solid #E0E0E0',
  boxShadow:
    '0px 2px 1px -1px rgba(0, 0, 0, 0.2), 0px 1px 1px rgba(0, 0, 0, 0.14), 0px 1px 3px rgba(0, 0, 0, 0.12)',
  borderRadius: '4px',

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

function QuoteDetailTable(props: ShoppingDetailTableProps, ref: Ref<unknown>) {
  const b3Lang = useB3Lang();
  const {
    total,
    getQuoteTableDetails,
    getTaxRate,
    quoteReviewedBySalesRep,
    displayDiscount,
    currency,
  } = props;

  const isEnableProduct = useAppSelector(
    ({ global }) => global.blockPendingQuoteNonPurchasableOOS.isEnableProduct,
  );
  const enteredInclusiveTax = useAppSelector(
    ({ storeConfigs }) => storeConfigs.currencies.enteredInclusiveTax,
  );

  const paginationTableRef = useRef<PaginationTableRefProps | null>(null);

  const [search, setSearch] = useState<SearchProps>({
    first: 12,
    offset: 0,
  });

  useImperativeHandle(ref, () => ({
    getList: () => paginationTableRef.current?.getList(),
    refreshList: () => {
      setSearch({
        offset: 0,
      });
    },
  }));

  const showPrice = (price: string, row: CustomFieldItems): string | number => {
    if (isEnableProduct) {
      if (quoteReviewedBySalesRep) {
        return price;
      }

      return getDisplayPrice({
        price,
        productInfo: row,
        showText: b3Lang('quoteDraft.quoteSummary.tbd'),
      });
    }

    return price;
  };
  const columnItems: Array<TableColumnItem<ProductInfoProps>> = [
    {
      key: 'Product',
      title: b3Lang('quoteDetail.table.product'),
      render: (row: CustomFieldItems) => {
        const optionsValue = row.options;
        const productUrl = row.productsSearch?.productUrl;

        return (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
            }}
          >
            <StyledImage
              alt="Product-img"
              loading="lazy"
              src={row.imageUrl || PRODUCT_DEFAULT_IMAGE}
            />
            <Box>
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
                {row.productName}
              </Typography>
              <Typography color="#616161" variant="body1">
                {row.sku}
              </Typography>
              {optionsValue.length > 0 && (
                <Box>
                  {optionsValue.map(
                    (option: OptionProps) =>
                      option.optionLabel && (
                        <Typography
                          key={`${option.optionId}_${option.optionName}_${option.optionLabel}`}
                          sx={{
                            fontSize: '0.75rem',
                            lineHeight: '1.5',
                            color: '#455A64',
                          }}
                        >
                          {option.optionName}: {option.optionLabel}
                        </Typography>
                      ),
                  )}
                </Box>
              )}
              {row.notes && (
                <Typography
                  color="#ED6C02"
                  sx={{
                    fontSize: '0.9rem',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                  variant="body1"
                >
                  <span>Notes: </span>
                  {row.notes}
                </Typography>
              )}
            </Box>
          </Box>
        );
      },
      width: '40%',
    },
    {
      key: 'Price',
      title: b3Lang('quoteDetail.table.price'),
      render: (row: CustomFieldItems) => {
        const {
          basePrice,
          offeredPrice,
          productsSearch: { variants = [], taxClassId },
        } = row;

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

        return (
          <>
            {isDiscount && (
              <Typography
                sx={{
                  padding: '12px 0 0 0',
                  textDecoration: 'line-through',
                }}
              >
                {showPrice(
                  currencyFormatConvert(price, {
                    currency,
                    isConversionRate: false,
                    useCurrentCurrency: Boolean(currency),
                  }),
                  row,
                )}
              </Typography>
            )}

            <Typography
              sx={{
                padding: isDiscount ? '0' : '12px 0 0 0',
                color: isDiscount ? '#2E7D32' : '#212121',
              }}
            >
              {showPrice(
                currencyFormatConvert(discountPrice, {
                  currency,
                  isConversionRate: false,
                  useCurrentCurrency: Boolean(currency),
                }),
                row,
              )}
            </Typography>
          </>
        );
      },
      width: '15%',
      style: {
        textAlign: 'right',
      },
    },
    {
      key: 'Qty',
      title: b3Lang('quoteDetail.table.qty'),
      render: (row) => (
        <Typography
          sx={{
            padding: '12px 0',
          }}
        >
          {row.quantity}
        </Typography>
      ),
      width: '15%',
      style: {
        textAlign: 'right',
      },
    },
    {
      key: 'Total',
      title: b3Lang('quoteDetail.table.total'),
      render: (row: CustomFieldItems) => {
        const {
          basePrice,
          quantity,
          offeredPrice,
          productsSearch: { variants = [], taxClassId },
        } = row;

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

        const total = price * Number(quantity);
        const totalWithDiscount = discountPrice * Number(quantity);

        return (
          <Box>
            {isDiscount && (
              <Typography
                sx={{
                  padding: '12px 0 0 0',
                  textDecoration: 'line-through',
                }}
              >
                {showPrice(
                  currencyFormatConvert(total, {
                    currency,
                    isConversionRate: false,
                    useCurrentCurrency: Boolean(currency),
                  }),
                  row,
                )}
              </Typography>
            )}
            <Typography
              sx={{
                padding: isDiscount ? '0' : '12px 0 0 0',
                color: isDiscount ? '#2E7D32' : '#212121',
              }}
            >
              {showPrice(
                currencyFormatConvert(totalWithDiscount, {
                  currency,
                  isConversionRate: false,
                  useCurrentCurrency: Boolean(currency),
                }),
                row,
              )}
            </Typography>
          </Box>
        );
      },
      width: '20%',
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
          margin: '0.5rem 0 1rem 0',
        }}
      >
        <Typography
          sx={{
            fontSize: '24px',
          }}
        >
          {b3Lang('quoteDetail.table.totalProducts', { total: total || 0 })}
        </Typography>
      </Box>
      <B3PaginationTable
        columnItems={columnItems}
        getRequestList={getQuoteTableDetails}
        hover
        isCustomRender={false}
        itemIsMobileSpacing={0}
        labelRowsPerPage={b3Lang('quoteDetail.table.perPage')}
        noDataText={b3Lang('quoteDetail.table.noProducts')}
        ref={paginationTableRef}
        renderItem={(row, index) => (
          <QuoteDetailTableCard
            currency={currency}
            displayDiscount={displayDiscount}
            getTaxRate={getTaxRate}
            item={row}
            itemIndex={index}
            len={total || 0}
            showPrice={showPrice}
          />
        )}
        rowsPerPageOptions={[12, 24, 36]}
        searchParams={search}
        showBorder={false}
        tableKey="productId"
      />
    </StyledQuoteTableContainer>
  );
}

export default forwardRef(QuoteDetailTable);
