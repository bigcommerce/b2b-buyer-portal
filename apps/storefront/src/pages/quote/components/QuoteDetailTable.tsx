import { forwardRef, Ref, useImperativeHandle, useRef, useState } from 'react'
import { useB3Lang } from '@b3/lang'
import { Box, styled, Typography } from '@mui/material'

import { B3PaginationTable } from '@/components/table/B3PaginationTable'
import { TableColumnItem } from '@/components/table/B3Table'
import { PRODUCT_DEFAULT_IMAGE } from '@/constants'
import { store } from '@/store'
import { currencyFormat } from '@/utils'
import { getBCPrice, getDisplayPrice } from '@/utils/b3Product/b3Product'

import QuoteDetailTableCard from './QuoteDetailTableCard'

interface ListItem {
  [key: string]: string
}

interface ProductInfoProps {
  basePrice: number | string
  baseSku: string
  createdAt: number
  discount: number | string
  enteredInclusive: boolean
  id: number | string
  itemId: number
  optionList: string
  primaryImage: string
  productId: number
  productName: string
  productUrl: string
  quantity: number | string
  tax: number | string
  updatedAt: number
  variantId: number
  variantSku: string
  productsSearch: CustomFieldItems
  offeredPrice: number | string
}

interface ListItemProps {
  node: ProductInfoProps
}

interface ShoppingDetailTableProps {
  total: number
  getQuoteTableDetails: (params: any) => Promise<{
    edges: any[]
    totalCount: number
  }>
  isHandleApprove: boolean
  getTaxRate: (taxClassId: number, variants: any) => number
}

interface SearchProps {
  first?: number
  offset?: number
}

interface OptionProps {
  optionId: number
  optionLabel: string
  optionName: string
  optionValue: string | number
}

interface PaginationTableRefProps extends HTMLInputElement {
  getList: () => void
  setList: (items?: ListItemProps[]) => void
  getSelectedValue: () => void
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
}))

const StyledImage = styled('img')(() => ({
  maxWidth: '60px',
  height: 'auto',
  marginRight: '0.5rem',
}))

function QuoteDetailTable(props: ShoppingDetailTableProps, ref: Ref<unknown>) {
  const b3Lang = useB3Lang()
  const { total, getQuoteTableDetails, getTaxRate, isHandleApprove } = props

  const {
    global: {
      enteredInclusive: enteredInclusiveTax,
      blockPendingQuoteNonPurchasableOOS: { isEnableProduct },
    },
  } = store.getState()

  const paginationTableRef = useRef<PaginationTableRefProps | null>(null)

  const [search, setSearch] = useState<SearchProps>({
    first: 12,
    offset: 0,
  })

  useImperativeHandle(ref, () => ({
    getList: () => paginationTableRef.current?.getList(),
    refreshList: () => {
      setSearch({
        offset: 0,
      })
    },
  }))

  const showPrice = (price: string, row: CustomFieldItems): string | number => {
    if (isEnableProduct) {
      if (isHandleApprove) return price
      return getDisplayPrice({
        price,
        productInfo: row,
        showText: b3Lang('quoteDraft.quoteSummary.tbd'),
      })
    }
    return price
  }
  const columnItems: TableColumnItem<ListItem>[] = [
    {
      key: 'Product',
      title: b3Lang('quoteDetail.table.product'),
      render: (row: CustomFieldItems) => {
        const optionsValue = row.options
        const productUrl = row.productsSearch?.productUrl

        return (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
            }}
          >
            <StyledImage
              src={row.imageUrl || PRODUCT_DEFAULT_IMAGE}
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
                  } = window
                  if (productUrl) {
                    window.location.href = `${origin}${productUrl}`
                  }
                }}
                sx={{
                  cursor: 'pointer',
                }}
              >
                {row.productName}
              </Typography>
              <Typography variant="body1" color="#616161">
                {row.sku}
              </Typography>
              {optionsValue.length > 0 && (
                <Box>
                  {optionsValue.map(
                    (option: OptionProps) =>
                      option.optionLabel && (
                        <Typography
                          sx={{
                            fontSize: '0.75rem',
                            lineHeight: '1.5',
                            color: '#455A64',
                          }}
                          key={`${option.optionName}_${option.optionLabel}`}
                        >
                          {`${option.optionName}: ${option.optionLabel}`}
                        </Typography>
                      )
                  )}
                </Box>
              )}
              {row.notes && (
                <Typography
                  variant="body1"
                  color="#ED6C02"
                  sx={{
                    fontSize: '0.9rem',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  <span>Notes: </span>
                  {row.notes}
                </Typography>
              )}
            </Box>
          </Box>
        )
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
        } = row

        const taxRate = getTaxRate(taxClassId, variants)
        const taxPrice = enteredInclusiveTax
          ? (+basePrice * taxRate) / (1 + taxRate)
          : +basePrice * taxRate
        const discountTaxPrice = enteredInclusiveTax
          ? (+offeredPrice * taxRate) / (1 + taxRate)
          : +offeredPrice * taxRate

        const price = getBCPrice(+basePrice, taxPrice)
        const discountPrice = getBCPrice(+offeredPrice, discountTaxPrice)

        const isDiscount = +basePrice - +offeredPrice > 0

        return (
          <>
            {isDiscount && (
              <Typography
                sx={{
                  padding: '12px 0 0 0',
                  textDecoration: 'line-through',
                }}
              >
                {showPrice(`${currencyFormat(price)}`, row)}
              </Typography>
            )}

            <Typography
              sx={{
                padding: isDiscount ? '0' : '12px 0 0 0',
                color: isDiscount ? '#2E7D32' : '#212121',
              }}
            >
              {showPrice(`${currencyFormat(discountPrice)}`, row)}
            </Typography>
          </>
        )
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
        } = row

        const taxRate = getTaxRate(taxClassId, variants)
        const taxPrice = enteredInclusiveTax
          ? (+basePrice * taxRate) / (1 + taxRate)
          : +basePrice * taxRate
        const discountTaxPrice = enteredInclusiveTax
          ? (+offeredPrice * taxRate) / (1 + taxRate)
          : +offeredPrice * taxRate

        const price = getBCPrice(+basePrice, taxPrice)
        const discountPrice = getBCPrice(+offeredPrice, discountTaxPrice)
        const isDiscount = +basePrice - +offeredPrice > 0

        const total = price * +quantity
        const totalWithDiscount = discountPrice * +quantity

        return (
          <Box>
            {isDiscount && (
              <Typography
                sx={{
                  padding: '12px 0 0 0',
                  textDecoration: 'line-through',
                }}
              >
                {showPrice(`${currencyFormat(total)}`, row)}
              </Typography>
            )}
            <Typography
              sx={{
                padding: isDiscount ? '0' : '12px 0 0 0',
                color: isDiscount ? '#2E7D32' : '#212121',
              }}
            >
              {showPrice(`${currencyFormat(totalWithDiscount)}`, row)}
            </Typography>
          </Box>
        )
      },
      width: '20%',
      style: {
        textAlign: 'right',
      },
    },
  ]

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
        ref={paginationTableRef}
        columnItems={columnItems}
        rowsPerPageOptions={[12, 24, 36]}
        getRequestList={getQuoteTableDetails}
        isCustomRender={false}
        hover
        searchParams={search}
        labelRowsPerPage={b3Lang('quoteDetail.table.perPage')}
        showBorder={false}
        itemIsMobileSpacing={0}
        noDataText={b3Lang('quoteDetail.table.noProducts')}
        tableKey="productId"
        renderItem={(row: ProductInfoProps, index?: number) => (
          <QuoteDetailTableCard
            len={total || 0}
            item={row}
            showPrice={showPrice}
            itemIndex={index}
            getTaxRate={getTaxRate}
          />
        )}
      />
    </StyledQuoteTableContainer>
  )
}

export default forwardRef(QuoteDetailTable)
