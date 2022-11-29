import {
  useContext,
  useEffect,
  useState,
} from 'react'
import {
  Box,
} from '@mui/material'
import {
  useNavigate,
} from 'react-router-dom'
import {
  format,
} from 'date-fns'
import {
  TableColumnItem,
  B3Table,
} from '@/components/table/B3Table'

import {
  GlobaledContext,
} from '@/shared/global'

import {
  useMobile,
} from '@/hooks'

import {
  distanceDay,
} from '@/utils'

import {
  getB2BAllOrders,
  getBCAllOrders,
  getOrderStatusType,
  getBcOrderStatusType,
} from '@/shared/service/b2b'

import {
  B3Sping,
} from '@/components/spin/B3Sping'

import {
  getInitFilter,
  FilterSearchProps,
  getFilterMoreData,
  currencySymbol,
  getOrderStatusText,
} from './config'

import {
  OrderStatus,
} from './components/OrderStatus'

import {
  OrderItemCard,
} from './OrderItemCard'

import B3Filter from '../../components/filter/B3Filter'

interface ListItem {
  [key: string]: string
}

interface ListCompanyItem {
  companyId?: {
    companyName: string,
  }
}

interface OrderPagination {
  offset: number,
  first: number,
  count: number,
}

interface SearchChangeProps {
  startValue?: string
  endValue?: string
  PlacedBy?: string
  orderStatus?: string | number
  company?: string
}
interface SortByListProps {
  [key: string]: number | string
}

const sortByList: Array<SortByListProps> = [
  {
    name: 'Created on',
    id: '-createdAt',
  },
  {
    name: 'Lowest Price',
    id: 'totalIncTax',
  },
  {
    name: 'Highest Price',
    id: '-totalIncTax',
  },
]

const sortByItemName = {
  labelName: 'name',
  valueName: 'id',
}

const sortByConfigData = {
  isEnabled: true,
  sortByList,
  sortByItemName,
  sortByLabel: 'Sort by',
  defaultValue: '-createdAt',
  isFirstSelect: false,
  w: 150,
}

interface OrderProps {
  isCompanyOrder?: boolean
}

// interface filterB2BDataProps {
//   allOrders: {
//     edges: Array<any>
//     totalCount: {[key: string]: number}
//   }
// }

// interface filterBCDataProps {
//   customerOrders: {
//     edges: Array<any>
//     totalCount: {[key: string]: number}
//   }
// }

interface ListItemsProps {
  node: {
    [key: string]: string | number | undefined | boolean
  }
}

const initPagination = {
  offset: 0,
  count: 0,
  first: 10,
}

const Order = ({
  isCompanyOrder = false,
}: OrderProps) => {
  const {
    state: {
      isB2BUser,
      isAgenting,
      role,
    },
  } = useContext(GlobaledContext)

  const [pagination, setPagination] = useState(initPagination)

  const [isMobile] = useMobile()

  const [listItems, setListItems] = useState<Array<ListItemsProps>>([])
  const [isRequestLoading, setIsRequestLoading] = useState(false)

  const [filterData, setFilterData] = useState<Partial<FilterSearchProps> | null>(null)

  const [filterInfo, setFilterInfo] = useState<Array<any>>([])

  const [getOrderStatuses, setOrderStatuses] = useState<Array<any>>([])

  useEffect(() => {
    const search = getInitFilter(isCompanyOrder, isB2BUser)
    setFilterData(search)
    const initFilter = async () => {
      const fn = isB2BUser ? getOrderStatusType : getBcOrderStatusType
      const orderStatusesName = isB2BUser ? 'orderStatuses' : 'bcOrderStatuses'
      const orderStatuses: CustomFieldItems = await fn()
      const filterInfo = getFilterMoreData(isB2BUser, isCompanyOrder, orderStatuses[orderStatusesName])
      setOrderStatuses(orderStatuses[orderStatusesName])
      setFilterInfo(filterInfo)
    }

    initFilter()
  }, [])

  const fetchList = async () => {
    if (filterData?.first) {
      const fn = isB2BUser ? getB2BAllOrders : getBCAllOrders

      const orders = isB2BUser ? 'allOrders' : 'customerOrders'
      try {
        setIsRequestLoading(true)
        const {
          [orders]: {
            edges: orderList = [],
            totalCount,
          },
        }: CustomFieldItems = await fn(filterData)
        const page = {
          ...pagination,
          count: totalCount,
        }
        if (isMobile) {
          const list = pagination.offset > 0 ? [...listItems, ...orderList] : [...orderList]
          setListItems(list)
        } else {
          setListItems(orderList)
        }
        setPagination(page)
      } finally {
        setIsRequestLoading(false)
      }
    }
  }

  useEffect(() => {
    fetchList()
  }, [filterData])

  const navigate = useNavigate()

  const goToDetail = (item: ListItem, index: number) => {
    navigate(`/orderDetail/${item.orderId}`, {
      state: {
        currentIndex: index,
        searchParams: filterData,
        totalCount: pagination.count,
        isCompanyOrder,
      },
    })
  }

  const columnAllItems: TableColumnItem<ListItem>[] = [
    {
      key: 'orderId',
      title: 'Order',
      render: (item: ListItem, index: number) => (
        <Box
          component="span"
          sx={{
            cursor: 'pointer',
            '&:hover': {
              textDecoration: 'underline',
            },
          }}
          onClick={() => goToDetail(item, index)}
        >
          {item.orderId}
        </Box>
      ),
    },
    {
      key: 'poNumber',
      title: 'PO / Reference',
      render: (item: ListItem) => (<Box>{item.poNumber ? item.poNumber : '-'}</Box>),
    },
    {
      key: 'totalIncTax',
      title: 'Grand total',
      render: (item: ListItem) => (`${currencySymbol(item.money)}${item.totalIncTax}`),
    },
    {
      key: 'status',
      title: 'Order status',
      render: (item: ListItem) => (
        <OrderStatus
          text={getOrderStatusText(item.status, getOrderStatuses)}
          code={item.status}
        />
      ),
      width: '200px',
    },
    {
      key: 'firstName',
      title: 'Placed by',
      render: (item: ListItem) => (`${item.firstName} ${item.lastName}`),
    },
    {
      key: 'companyId',
      title: 'Company',
      render: (item) => (`${((item as ListCompanyItem)?.companyId)?.companyName || ''}`),
    },
    {
      key: 'createdAt',
      title: 'Created on',
      render: (item: ListItem) => format(+item.createdAt * 1000, 'dd MMM yy'),
    },
  ]

  const getColumnItems = () => {
    const getNewColumnItems = columnAllItems.filter((item: {key: string}) => {
      const {
        key,
      } = item
      if (!isB2BUser && (key === 'companyId' || key === 'poNumber' || key === 'firstName')) return false
      // if (key === 'companyId' && ((isB2BUser && !isCompanyOrder) || +role !== 3 || isAgenting)) return false
      if (key === 'companyId' && !(+role === 3 && !isAgenting)) return false
      return true
    })

    return getNewColumnItems
  }

  const handlePaginationChange = (pagination: OrderPagination) => {
    const data: Partial<FilterSearchProps> = {
      ...filterData,
    }
    data.first = pagination.first
    data.offset = pagination.offset
    setPagination(pagination)
    setFilterData(data)
  }
  const handleChange = (key:string, value: string) => {
    if (key === 'search') {
      setFilterData({
        ...filterData,
        q: value,
        ...initPagination,
      })
    } else if (key === 'sortBy') {
      setFilterData({
        ...filterData,
        orderBy: value,
        ...initPagination,
      })
    }
    setPagination(initPagination)
  }

  const handleFirterChange = (value: SearchChangeProps) => {
    const search: Partial<FilterSearchProps> = {
      beginDateAt: value?.startValue || filterData?.beginDateAt,
      endDateAt: value?.endValue || filterData?.endDateAt,
      createdBy: value?.PlacedBy || filterData?.createdBy,
      statusCode: value?.orderStatus || '',
      companyName: value?.company || filterData?.companyName || '',
    }

    setFilterData({
      ...filterData,
      ...search,
      ...initPagination,
    })
    setPagination(initPagination)
  }

  const columnItems = getColumnItems()

  return (
    (
      <B3Sping
        isSpinning={isRequestLoading}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
          }}
        >
          <B3Filter
            sortByConfig={sortByConfigData}
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
            fiterMoreInfo={filterInfo}
            handleChange={handleChange}
            handleFilterChange={handleFirterChange}
          />
          <B3Table
            columnItems={columnItems}
            listItems={listItems}
            pagination={pagination}
            onPaginationChange={handlePaginationChange}
            isCustomRender={false}
            isInfiniteScroll={isMobile}
            isLoading={isRequestLoading}
            tableKey="orderId"
            renderItem={(row: ListItem, index: number) => (
              <OrderItemCard
                key={row.orderId}
                item={row}
                index={index}
                pagination={pagination}
                filterData={filterData}
                isCompanyOrder={isCompanyOrder}
              />
            )}
          />
        </Box>
      </B3Sping>
    )
  )
}

export default Order
