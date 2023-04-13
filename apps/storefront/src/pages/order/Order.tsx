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
  getOrdersCreatedByUser,
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
    name: 'Lowest Total',
    id: 'totalIncTax',
  },
  {
    name: 'Highest Total',
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
      companyInfo: {
        id: companyB2BId,
      },
      salesRepCompanyId,
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
      const companyId = companyB2BId || salesRepCompanyId
      let createdByUsers: CustomFieldItems = {}
      if (isB2BUser && isCompanyOrder) createdByUsers = await getOrdersCreatedByUser(+companyId, 0)

      const fn = isB2BUser ? getOrderStatusType : getBcOrderStatusType
      const orderStatusesName = isB2BUser ? 'orderStatuses' : 'bcOrderStatuses'
      const orderStatuses: CustomFieldItems = await fn()

      const filterInfo = getFilterMoreData(isB2BUser, role, isCompanyOrder, isAgenting, createdByUsers, orderStatuses[orderStatusesName])
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
      width: '10%',
    },
    {
      key: 'poNumber',
      title: 'PO / Reference',
      render: (item: ListItem) => (<Box>{item.poNumber ? item.poNumber : '-'}</Box>),
      width: '10%',
    },
    // item.poNumber ? (
    //   <Box>
    //     {item.poNumber}
    //   </Box>
    // ) : (
    //   <Box sx={{
    //     borderStyle: 'dashed',
    //     width: '10px',
    //   }}
    //   />
    // )
    {
      key: 'totalIncTax',
      title: 'Grand total',
      render: (item: ListItem) => (`${currencySymbol(item.money)}${item.totalIncTax}`),
      width: '8%',
      style: {
        textAlign: 'right',
      },
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
      width: '10%',
    },
    {
      key: 'placedby',
      title: 'Placed by',
      render: (item: ListItem) => (`${item.firstName} ${item.lastName}`),
      width: '10%',
    },
    {
      key: 'createdAt',
      title: 'Created on',
      render: (item: ListItem) => format(+item.createdAt * 1000, 'dd MMM yyyy'),
      width: '10%',
    },
    {
      key: 'companyId',
      title: 'Company',
      render: (item) => (`${((item as ListCompanyItem)?.companyId)?.companyName || ''}`),
      width: '10%',
    },
  ]

  const getColumnItems = () => {
    const getNewColumnItems = columnAllItems.filter((item: {key: string}) => {
      const {
        key,
      } = item
      if ((!isB2BUser || (+role === 3 && !isAgenting)) && (key === 'placedby')) return false
      if (key === 'companyId' && (isB2BUser && (+role !== 3 || isAgenting))) return false
      if ((key === 'companyId' || key === 'placedby') && !(+role === 3 && !isAgenting) && !isCompanyOrder) return false
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
            onClickRow={(item: ListItem, index?: number) => {
              if (index !== undefined) {
                goToDetail(item, index)
              }
            }}
            hover
          />
        </Box>
      </B3Sping>
    )
  )
}

export default Order
