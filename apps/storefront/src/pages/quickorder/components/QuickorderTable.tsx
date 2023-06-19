import {
  Dispatch,
  ReactElement,
  SetStateAction,
  useContext,
  useRef,
  useState,
} from 'react'
import { Box, styled, TextField, Typography } from '@mui/material'

import { B3Sping } from '@/components'
import { B3PaginationTable } from '@/components/table/B3PaginationTable'
import { TableColumnItem } from '@/components/table/B3Table'
import { PRODUCT_DEFAULT_IMAGE } from '@/constants'
import { useMobile } from '@/hooks'
import { GlobaledContext } from '@/shared/global'
import {
  getBcOrderedProducts,
  getOrderedProducts,
  searchB2BProducts,
  searchBcProducts,
} from '@/shared/service/b2b'
import {
  currencyFormat,
  displayFormat,
  distanceDay,
  getDefaultCurrencyInfo,
  getProductPriceIncTax,
  snackbar,
} from '@/utils'
import { conversionProductsList } from '@/utils/b3Product/shared/config'

import B3FilterMore from '../../../components/filter/B3FilterMore'
import B3FilterPicker from '../../../components/filter/B3FilterPicker'
import B3FilterSearch from '../../../components/filter/B3FilterSearch'

import QuickOrderCard from './QuickOrderCard'

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
}

interface ListItemProps {
  node: ProductInfoProps
}

interface SearchProps {
  q: string
  first?: number
  offset?: number
  beginDateAt?: Date | string | number
  endDateAt?: Date | string | number
}

interface PaginationTableRefProps extends HTMLInputElement {
  getList: () => void
  getCacheList: () => void
  setCacheAllList: (items?: ListItemProps[]) => void
  setList: (items?: ListItemProps[]) => void
  getSelectedValue: () => void
}

const StyledImage = styled('img')(() => ({
  maxWidth: '60px',
  height: 'auto',
  marginRight: '0.5rem',
}))

const StyleQuickOrderTable = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  width: '100%',

  '& tbody': {
    '& tr': {
      '& td': {
        verticalAlign: 'top',
      },
      '& td: first-of-type': {
        paddingTop: '25px',
      },
    },
  },
}))

interface QuickorderTableProps {
  setIsRequestLoading: Dispatch<SetStateAction<boolean>>
  setCheckedArr: (values: CustomFieldItems) => void
  isRequestLoading: boolean
}

const StyledTextField = styled(TextField)(() => ({
  '& input': {
    paddingTop: '12px',
    paddingRight: '6px',
  },
}))

function QuickorderTable({
  setIsRequestLoading,
  setCheckedArr,
  isRequestLoading,
}: QuickorderTableProps) {
  const paginationTableRef = useRef<PaginationTableRefProps | null>(null)

  const {
    state: {
      isB2BUser,
      companyInfo: { id: companyInfoId },
      customer: { customerGroupId },
    },
  } = useContext(GlobaledContext)

  const [search, setSearch] = useState<SearchProps>({
    q: '',
    beginDateAt: distanceDay(90),
    endDateAt: distanceDay(0),
  })

  const [total, setTotalCount] = useState<number>(0)

  const [isMobile] = useMobile()

  const { currency_code: currencyCode } = getDefaultCurrencyInfo()

  const handleGetProductsById = async (listProducts: ListItemProps[]) => {
    if (listProducts.length > 0) {
      const productIds: number[] = []
      listProducts.forEach((item) => {
        const { node } = item
        node.quantity = 1
        if (!productIds.includes(node.productId)) {
          productIds.push(node.productId)
        }
      })

      const getProducts = isB2BUser ? searchB2BProducts : searchBcProducts

      try {
        const { productsSearch } = await getProducts({
          productIds,
          currencyCode,
          companyId: companyInfoId,
          customerGroupId,
        })

        const newProductsSearch = conversionProductsList(productsSearch)

        listProducts.forEach((item) => {
          const { node } = item

          const productInfo = newProductsSearch.find(
            (search: CustomFieldItems) => {
              const { id: productId } = search

              return +node.productId === +productId
            }
          )

          node.productsSearch = productInfo || {}
        })

        return listProducts
      } catch (err: any) {
        snackbar.error(err)
      }
    }
    return []
  }

  const getList = async (params: SearchProps) => {
    const fn = isB2BUser ? getOrderedProducts : getBcOrderedProducts

    const {
      orderedProducts: { edges, totalCount },
    } = await fn(params)

    const listProducts = await handleGetProductsById(edges)

    setTotalCount(totalCount)

    return {
      edges: listProducts,
      totalCount,
    }
  }

  const handleSearchProduct = async (q: string) => {
    setSearch({
      ...search,
      q,
    })
  }

  const getSelectCheckbox = (selectCheckbox: Array<string | number>) => {
    if (selectCheckbox.length > 0) {
      const productList = paginationTableRef.current?.getCacheList() || []
      const checkedItems = selectCheckbox.map((item: number | string) => {
        const newItems = productList.find((product: ListItemProps) => {
          const { node } = product

          return node.id === item
        })

        return newItems
      })

      setCheckedArr([...checkedItems])
    } else {
      setCheckedArr([])
    }
  }

  const handlePickerChange = (key: string, value: Date | string | number) => {
    const params = {
      ...search,
    }
    if (key === 'start') {
      params.beginDateAt = value || distanceDay(90)
    } else {
      params.endDateAt = value || distanceDay(0)
    }

    setSearch(params)
  }

  const handleFilterChange = (data: any) => {
    const params = {
      ...search,
    }

    params.beginDateAt = data.startValue

    params.endDateAt = data.endValue

    setSearch(params)
  }

  const handleUpdateProductQty = (
    id: number | string,
    value: number | string
  ) => {
    if (value !== '' && +value <= 0) return
    const listItems = paginationTableRef.current?.getList() || []
    const listCacheItems = paginationTableRef.current?.getCacheList() || []

    const newListItems = listItems?.map((item: ListItemProps) => {
      const { node } = item
      if (node?.id === id) {
        node.quantity = +value || ''
      }

      return item
    })
    const newListCacheItems = listCacheItems?.map((item: ListItemProps) => {
      const { node } = item
      if (node?.id === id) {
        node.quantity = +value || ''
      }

      return item
    })
    paginationTableRef.current?.setList([...newListItems])
    paginationTableRef.current?.setCacheAllList([...newListCacheItems])
  }

  const columnItems: TableColumnItem<ListItem>[] = [
    {
      key: 'Product',
      title: 'Product',
      render: (row: CustomFieldItems) => {
        const { optionList } = row
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
                {row.variantSku}
              </Typography>
              {optionList.length > 0 && (
                <Box>
                  {optionList.map((option: any) => (
                    <Typography
                      sx={{
                        fontSize: '0.75rem',
                        lineHeight: '1.5',
                        color: '#455A64',
                      }}
                      key={option.id}
                    >
                      {`${option.display_name}: ${option.display_value}`}
                    </Typography>
                  ))}
                </Box>
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
        const {
          productsSearch: { variants },
          variantId,
          basePrice,
          quantity,
        } = row
        let priceIncTax = +basePrice
        if (variants?.length) {
          priceIncTax =
            getProductPriceIncTax(variants, +variantId) || +basePrice
        }

        const withTaxPrice = priceIncTax || +basePrice
        const price = withTaxPrice * +quantity

        return (
          <Typography
            sx={{
              padding: '12px 0',
            }}
          >
            {`${currencyFormat(price)}`}
          </Typography>
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
            handleUpdateProductQty(row.id, e.target.value)
          }}
        />
      ),
      width: '15%',
      style: {
        textAlign: 'right',
      },
    },
    {
      key: 'lastOrderedAt',
      title: 'Last ordered',
      render: (row: CustomFieldItems) => (
        <Box>
          <Typography
            sx={{
              padding: '12px 0',
            }}
          >
            {`${displayFormat(+row.lastOrderedAt)}`}
          </Typography>
        </Box>
      ),
      width: '15%',
      style: {
        textAlign: 'right',
      },
    },
  ]

  return (
    <B3Sping isSpinning={isRequestLoading}>
      <StyleQuickOrderTable>
        <Typography
          sx={{
            fontSize: '24px',
            height: '50px',
          }}
        >
          {`${total} products`}
        </Typography>
        <Box
          sx={{
            marginBottom: '5px',
            display: 'flex',
            '& label': {
              zIndex: 0,
            },
          }}
        >
          <Box
            sx={{
              width: isMobile ? '100%' : '40%',
              mr: '20px',
              display: 'flex',
              justifyContent: isMobile ? 'space-between' : 'flex-start',
            }}
          >
            <B3FilterSearch
              h="48px"
              searchBGColor="rgba(0, 0, 0, 0.06)"
              handleChange={(e) => {
                handleSearchProduct(e)
              }}
            />

            {isMobile && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <B3FilterMore
                  fiterMoreInfo={[]}
                  startPicker={{
                    isEnabled: true,
                    label: 'From',
                    defaultValue: search?.beginDateAt || '',
                    pickerKey: 'start',
                  }}
                  endPicker={{
                    isEnabled: true,
                    label: 'To',
                    defaultValue: search?.endDateAt || '',
                    pickerKey: 'end',
                  }}
                  isShowMore
                  onChange={handleFilterChange}
                />
              </Box>
            )}
          </Box>

          {!isMobile && (
            <B3FilterPicker
              handleChange={handlePickerChange}
              xs={{
                mt: 0,
                height: '50px',
              }}
              startPicker={{
                isEnabled: true,
                label: 'From',
                defaultValue: distanceDay(90),
                pickerKey: 'start',
              }}
              endPicker={{
                isEnabled: true,
                label: 'To',
                defaultValue: distanceDay(),
                pickerKey: 'end',
              }}
              customWidth="58%"
            />
          )}
        </Box>

        <B3PaginationTable
          ref={paginationTableRef}
          columnItems={columnItems}
          rowsPerPageOptions={[12, 24, 36]}
          getRequestList={getList}
          searchParams={search}
          isCustomRender={false}
          showCheckbox
          disableCheckbox={false}
          hover
          labelRowsPerPage="Items per page:"
          showBorder={false}
          requestLoading={setIsRequestLoading}
          getSelectCheckbox={getSelectCheckbox}
          itemIsMobileSpacing={0}
          isSelectOtherPageCheckbox
          noDataText="No products found"
          renderItem={(
            row: ProductInfoProps,
            index?: number,
            checkBox?: () => ReactElement
          ) => (
            <QuickOrderCard
              item={row}
              checkBox={checkBox}
              handleUpdateProductQty={handleUpdateProductQty}
            />
          )}
        />
      </StyleQuickOrderTable>
    </B3Sping>
  )
}

export default QuickorderTable
