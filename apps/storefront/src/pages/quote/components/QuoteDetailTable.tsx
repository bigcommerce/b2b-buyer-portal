import {
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
  Ref,
} from 'react'

import {
  Box,
  styled,
  Typography,
} from '@mui/material'

import {
  TableColumnItem,
} from '@/components/table/B3Table'

import {
  B3PaginationTable,
} from '@/components/table/B3PaginationTable'

import QuoteDetailTableCard from './QuoteDetailTableCard'

interface ListItem {
  [key: string]: string
}

interface ProductInfoProps {
  basePrice: number | string,
  baseSku: string,
  createdAt: number,
  discount: number | string,
  enteredInclusive: boolean,
  id: number | string,
  itemId: number,
  optionList: string,
  primaryImage: string,
  productId: number,
  productName: string,
  productUrl: string,
  quantity: number | string,
  tax: number | string,
  updatedAt: number,
  variantId: number,
  variantSku: string,
  productsSearch: CustomFieldItems,
}

interface ListItemProps {
  node: ProductInfoProps,
}

interface ShoppingDetailTableProps {
  total: number,
  currencyToken?: string,
  getQuoteTableDetails: any,
}

interface SearchProps {
  first?: number,
  offset?: number,
}

interface PaginationTableRefProps extends HTMLInputElement {
  getList: () => void,
  setList: (items?: ListItemProps[]) => void,
  getSelectedValue: () => void,
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

const defaultProductImage = 'https://cdn11.bigcommerce.com/s-1i6zpxpe3g/stencil/cd9e3830-4c73-0139-8a51-0242ac11000a/e/4fe76590-73f1-0139-3767-32e4ea84ca1d/img/ProductDefault.gif'

const QuoteDetailTable = (props: ShoppingDetailTableProps, ref: Ref<unknown>) => {
  const {
    total,
    currencyToken,
    getQuoteTableDetails,
  } = props

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
              src={row.imageUrl || defaultProductImage}
              alt="Product-img"
              loading="lazy"
            />
            <Box>
              <Typography
                variant="body1"
                color="#212121"
              >
                {row.productName}
              </Typography>
              <Typography
                variant="body1"
                color="#616161"
              >
                {row.sku}
              </Typography>
              {
                optionsValue.length > 0 && (
                  <Box>
                    {
                      optionsValue.map((option: any) => (option.optionLabel ? (
                        <Typography
                          sx={{
                            fontSize: '0.75rem',
                            lineHeight: '1.5',
                            color: '#455A64',
                          }}
                          key={`${option.optionName}_${option.optionLabel}`}
                        >
                          {`${option.optionName
                          }: ${option.optionLabel
                          }`}
                        </Typography>
                      ) : <></>))
                    }
                  </Box>
                )
              }
              {
                row.notes && (
                <Typography
                  variant="body1"
                  color="#616161"
                  sx={{
                    fontSize: '0.9rem',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  <div>Notes:</div>
                  {row.notes}
                </Typography>
                )
              }

            </Box>
          </Box>
        )
      },
      width: '40%',
    },
    {
      key: 'Price',
      title: 'Price',
      render: (row) => {
        const {
          basePrice,
          offeredPrice,
        } = row

        const price = +basePrice
        const discountPrice = +offeredPrice
        const isDiscount = price - discountPrice > 0

        return (
          <>
            {
              isDiscount && (
                <Typography
                  sx={{
                    padding: '12px 0 0 0',
                    textDecoration: 'line-through',
                  }}
                >
                  {`${currencyToken}${price.toFixed(2)}`}
                </Typography>
              )
            }

            <Typography
              sx={{
                padding: isDiscount ? '0' : '12px 0 0 0',
                color: isDiscount ? '#2E7D32' : '#212121',
              }}
            >
              {`${currencyToken}${discountPrice.toFixed(2)}`}
            </Typography>

          </>
        )
      },
      width: '15%',
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
    },
    {
      key: 'Total',
      title: 'Total',
      render: (row: CustomFieldItems) => {
        const {
          basePrice,
          quantity,
          offeredPrice,
        } = row
        const price = +basePrice
        const discountPrice = +offeredPrice
        const isDiscount = price - discountPrice > 0

        const total = price * +quantity
        const totalWithDiscount = discountPrice * +quantity

        return (
          <Box>
            {
              isDiscount && (
                <Typography
                  sx={{
                    padding: '12px 0 0 0',
                    textDecoration: 'line-through',
                  }}
                >
                  {`${currencyToken}${total.toFixed(2)}`}
                </Typography>
              )
            }
            <Typography
              sx={{
                padding: isDiscount ? '0' : '12px 0 0 0',
                color: isDiscount ? '#2E7D32' : '#212121',
              }}
            >
              {`${currencyToken}${totalWithDiscount.toFixed(2)}`}
            </Typography>
          </Box>
        )
      },
      width: '20%',
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
          <QuoteDetailTableCard
            len={total || 0}
            item={row}
            itemIndex={index}
            currencyToken={currencyToken || '$'}
          />
        )}
      />
    </StyledQuoteTableContainer>
  )
}

export default forwardRef(QuoteDetailTable)
