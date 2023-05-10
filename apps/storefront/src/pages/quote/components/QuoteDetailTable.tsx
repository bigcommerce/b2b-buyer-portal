import { forwardRef, Ref, useImperativeHandle, useRef, useState } from 'react'
import { Box, styled, Typography } from '@mui/material'

import { B3PaginationTable } from '@/components/table/B3PaginationTable'
import { TableColumnItem } from '@/components/table/B3Table'
import { PRODUCT_DEFAULT_IMAGE } from '@/constants'
import { currencyFormat } from '@/utils'

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
  getQuoteTableDetails: any
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
  padding: '0.5rem',
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
}))

const StyledImage = styled('img')(() => ({
  maxWidth: '60px',
  height: 'auto',
  marginRight: '0.5rem',
}))

function QuoteDetailTable(props: ShoppingDetailTableProps, ref: Ref<unknown>) {
  const { total, getQuoteTableDetails } = props

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

  const columnItems: TableColumnItem<ListItem>[] = [
    {
      key: 'Product',
      title: 'Product',
      render: (row: CustomFieldItems) => {
        const optionsValue = row.options

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
              <Typography variant="body1" color="#212121">
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
      title: 'Price',
      render: (row: CustomFieldItems) => {
        const { basePrice, offeredPrice } = row

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
                {`${currencyFormat(+basePrice)}`}
              </Typography>
            )}

            <Typography
              sx={{
                padding: isDiscount ? '0' : '12px 0 0 0',
                color: isDiscount ? '#2E7D32' : '#212121',
              }}
            >
              {`${currencyFormat(offeredPrice)}`}
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
      title: 'Qty',
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
      title: 'Total',
      render: (row: CustomFieldItems) => {
        const { basePrice, quantity, offeredPrice } = row
        const isDiscount = +basePrice - +offeredPrice > 0

        const total = +basePrice * +quantity
        const totalWithDiscount = +offeredPrice * +quantity

        return (
          <Box>
            {isDiscount && (
              <Typography
                sx={{
                  padding: '12px 0 0 0',
                  textDecoration: 'line-through',
                }}
              >
                {`${currencyFormat(total)}`}
              </Typography>
            )}
            <Typography
              sx={{
                padding: isDiscount ? '0' : '12px 0 0 0',
                color: isDiscount ? '#2E7D32' : '#212121',
              }}
            >
              {`${currencyFormat(totalWithDiscount)}`}
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
          {`${total || 0} products`}
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
        labelRowsPerPage="Per page:"
        showBorder={false}
        itemIsMobileSpacing={0}
        noDataText="No products found"
        tableKey="productId"
        renderItem={(row: ProductInfoProps, index?: number) => (
          <QuoteDetailTableCard len={total || 0} item={row} itemIndex={index} />
        )}
      />
    </StyledQuoteTableContainer>
  )
}

export default forwardRef(QuoteDetailTable)
