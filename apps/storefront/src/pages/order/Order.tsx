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
} from '@/components/table/B3Table'

import {
  B3PaginationTable,
} from '@/components/table/B3PaginationTable'

import {
  GlobaledContext,
} from '@/shared/global'

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

  const [isRequestLoading, setIsRequestLoading] = useState(false)

  const [allTotal, setAllTotal] = useState(0)

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

      const filterCondition = isB2BUser && !(role === 3 && !isAgenting)
      const filterInfo = getFilterMoreData(filterCondition, isCompanyOrder, orderStatuses[orderStatusesName])
      setOrderStatuses(orderStatuses[orderStatusesName])
      setFilterInfo(filterInfo)
    }

    initFilter()
  }, [])

  const fetchList = async (params: Partial<FilterSearchProps>) => {
    const fn = isB2BUser ? getB2BAllOrders : getBCAllOrders
    const orders = isB2BUser ? 'allOrders' : 'customerOrders'
    const {
      [orders]: {
        edges = [],
        totalCount,
      },
    } = await fn(params)

    setAllTotal(totalCount)

    return {
      edges,
      totalCount,
    }
  }

  const navigate = useNavigate()

  const goToDetail = (item: ListItem, index: number) => {
    navigate(`/orderDetail/${item.orderId}`, {
      state: {
        currentIndex: index,
        searchParams: filterData,
        totalCount: allTotal,
        isCompanyOrder,
        beginDateAt: filterData?.beginDateAt,
        endDateAt: filterData?.endDateAt,
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
      key: 'placedby',
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
      render: (item: ListItem) => format(+item.createdAt * 1000, 'dd MMM yyyy'),
    },
  ]

  const getColumnItems = () => {
    const getNewColumnItems = columnAllItems.filter((item: {key: string}) => {
      const {
        key,
      } = item
      if ((!isB2BUser || (+role === 3 && !isAgenting)) && (key === 'placedby')) return false
      // if (key === 'companyId' && ((isB2BUser && !isCompanyOrder) || +role !== 3 || isAgenting)) return false
      if ((key === 'companyId' || key === 'placedby') && !(+role === 3 && !isAgenting)) return false
      return true
    })

    return getNewColumnItems
  }

  const handleChange = (key:string, value: string) => {
    if (key === 'search') {
      setFilterData({
        ...filterData,
        q: value,
      })
    } else if (key === 'sortBy') {
      setFilterData({
        ...filterData,
        orderBy: value,
      })
    }
  }

  const handleFirterChange = (value: SearchChangeProps) => {
    const search: Partial<FilterSearchProps> = {
      beginDateAt: value?.startValue || null,
      endDateAt: value?.endValue || null,
      createdBy: value?.PlacedBy || '',
      statusCode: value?.orderStatus || '',
      companyName: value?.company || '',
    }
    setFilterData({
      ...filterData,
      ...search,
    })
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
              defaultValue: filterData?.beginDateAt || null,
              pickerKey: 'start',
            }}
            endPicker={{
              isEnabled: true,
              label: 'To',
              defaultValue: filterData?.endDateAt || null,
              pickerKey: 'end',
            }}
            fiterMoreInfo={filterInfo}
            handleChange={handleChange}
            handleFilterChange={handleFirterChange}
          />
          <B3PaginationTable
            columnItems={columnItems}
            rowsPerPageOptions={[10, 20, 30]}
            getRequestList={fetchList}
            searchParams={filterData || {}}
            isCustomRender={false}
            requestLoading={setIsRequestLoading}
            tableKey="orderId"
            renderItem={(row: ListItem, index?: number) => (
              <OrderItemCard
                key={row.orderId}
                item={row}
                index={index}
                allTotal={allTotal}
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
