import {
  useState,
  useRef,
  ReactElement,
  Dispatch,
  SetStateAction,
  useContext,
} from 'react'

import {
  Box,
  styled,
  TextField,
  Typography,
} from '@mui/material'

import {
  format,
} from 'date-fns'
import {
  getOrderedProducts,
  getBcOrderedProducts,
} from '@/shared/service/b2b'

import {
  getDefaultCurrencyInfo,
  distanceDay,
} from '@/utils'

import {
  GlobaledContext,
} from '@/shared/global'

import {
  TableColumnItem,
} from '@/components/table/B3Table'

import {
  B3PaginationTable,
} from '@/components/table/B3PaginationTable'

import {
  useMobile,
} from '@/hooks'

import B3FilterSearch from '../../../components/filter/B3FilterSearch'

import B3FilterPicker from '../../../components/filter/B3FilterPicker'

import B3FilterMore from '../../../components/filter/B3FilterMore'

import QuickOrderCard from './QuickOrderCard'

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

interface SearchProps {
  q: string,
  first?: number,
  offset?: number,
  beginDateAt?: Date | string | number,
  endDateAt?: Date | string | number,
}

interface PaginationTableRefProps extends HTMLInputElement {
  getList: () => void,
  setList: (items?: ListItemProps[]) => void,
  getSelectedValue: () => void,
}

const StyledImage = styled('img')(() => ({
  maxWidth: '60px',
  height: 'auto',
  marginRight: '0.5rem',
}))

const defaultProductImage = 'https://cdn11.bigcommerce.com/s-1i6zpxpe3g/stencil/cd9e3830-4c73-0139-8a51-0242ac11000a/e/4fe76590-73f1-0139-3767-32e4ea84ca1d/img/ProductDefault.gif'

interface QuickorderTableProps {
  setIsRequestLoading: Dispatch<SetStateAction<boolean>>,
  setCheckedArr: (values: CustomFieldItems) => void,
}

const StyledTextField = styled(TextField)(() => ({
  '& input': {
    paddingTop: '12px',
    paddingRight: '6px',
  },
}))

const QuickorderTable = ({
  setIsRequestLoading,
  setCheckedArr,
}: QuickorderTableProps) => {
  const paginationTableRef = useRef<PaginationTableRefProps | null>(null)

  const {
    state: {
      isB2BUser,
    },
  } = useContext(GlobaledContext)

  const [search, setSearch] = useState<SearchProps>({
    q: '',
    beginDateAt: distanceDay(30),
    endDateAt: distanceDay(0),
  })

  const [total, setTotalCount] = useState<number>(0)

  const [isMobile] = useMobile()

  const {
    token: currencyToken,
  } = getDefaultCurrencyInfo()

  const handleGetProductsById = async (listProducts: ListItemProps[]) => {
    if (listProducts.length > 0) {
      const productIds: number[] = []
      listProducts.forEach((item) => {
        const {
          node,
        } = item
        node.quantity = 1
        if (!productIds.includes(node.productId)) {
          productIds.push(node.productId)
        }
      })
      return listProducts
    }
  }

  const getList = async (params: SearchProps) => {
    const fn = isB2BUser ? getOrderedProducts : getBcOrderedProducts

    const {
      orderedProducts: {
        edges,
        totalCount,
      },
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
      q,
    })
  }

  const getSelectCheckbox = (selectCheckbox: Array<string | number>) => {
    if (selectCheckbox.length > 0) {
      const productList = paginationTableRef.current?.getList() || []
      const checkedItems = selectCheckbox.map((item: number | string) => {
        const newItems = productList.find((product: ListItemProps) => {
          const {
            node,
          } = product

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
      params.beginDateAt = value || distanceDay(30)
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

  const handleUpdateProductQty = (id: number | string, value: number | string) => {
    const listItems = paginationTableRef.current?.getList() || []
    const newListItems = listItems?.map((item: ListItemProps) => {
      const {
        node,
      } = item
      if (node?.id === id) {
        node.quantity = +value || ''
      }

      return item
    })
    paginationTableRef.current?.setList([...newListItems])
  }

  const columnItems: TableColumnItem<ListItem>[] = [
    {
      key: 'Product',
      title: 'Product',
      render: (row: CustomFieldItems) => {
        const {
          optionList,
        } = row
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
                {row.variantSku}
              </Typography>
              {
                (optionList.length > 0) && (
                  <Box>
                    {
                      optionList.map((option: any) => (
                        <Typography
                          sx={{
                            fontSize: '0.75rem',
                            lineHeight: '1.5',
                            color: '#455A64',
                          }}
                          key={option.id}
                        >
                          {`${option.display_name
                          }: ${option.display_value}`}
                        </Typography>
                      ))
                    }
                  </Box>
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
        const price = +row.basePrice * (+row.quantity)

        return (
          <Typography
            sx={{
              padding: '12px 0',
            }}
          >
            {`${currencyToken}${(price).toFixed(2)}`}
          </Typography>
        )
      },
      width: '15%',
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
            inputMode: 'numeric', pattern: '[0-9]*',
          }}
          onChange={(e) => {
            handleUpdateProductQty(row.id, e.target.value)
          }}
        />
      ),
      width: '15%',
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
            {format(+row.lastOrderedAt * 1000, 'dd MMM yy')}
          </Typography>
        </Box>
      ),
      width: '20%',
    },
  ]

  return (

    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
      }}
    >
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

          {
            isMobile && (
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
            )
          }

        </Box>

        {
          !isMobile && (
          <B3FilterPicker
            handleChange={handlePickerChange}
            xs={{
              mt: 0,
              height: '50px',
            }}
            startPicker={{
              isEnabled: true,
              label: 'From',
              defaultValue: distanceDay(30),
              pickerKey: 'start',
            }}
            endPicker={{
              isEnabled: true,
              label: 'To',
              defaultValue: distanceDay(),
              pickerKey: 'end',
            }}
          />
          )
        }

      </Box>

      <B3PaginationTable
        ref={paginationTableRef}
        columnItems={columnItems}
        rowsPerPageOptions={[10, 20, 50]}
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
        noDataText="No products found"
        renderItem={(row: ProductInfoProps, index?: number, checkBox?: () => ReactElement) => (
          <QuickOrderCard
            item={row}
            checkBox={checkBox}
            currencyToken={currencyToken}
            handleUpdateProductQty={handleUpdateProductQty}
          />
        )}
      />

    </Box>

  )
}

export default QuickorderTable
