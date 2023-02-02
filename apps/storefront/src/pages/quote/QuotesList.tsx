import {
  useContext,
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
  getB2BQuotesList,
  getBCQuotesList,
} from '@/shared/service/b2b'

import {
  B3Sping,
} from '@/components/spin/B3Sping'

import {
  displayFormat,
} from '@/utils/b3DateFormat'

import B3Filter from '../../components/filter/B3Filter'

import {
  QuoteStatus,
} from './components/QuoteStatus'

import {
  QuoteItemCard,
} from './components/QuoteItemCard'

import {
  distanceDay,
} from '@/utils'

interface SortByListProps {
  [key: string]: number | string
}

interface ListItem {
  [key: string]: string | Object
  status: string,
  quoteNumber: string,
  currency: {
    token: string
  }
}

interface FilterSearchProps {
  first: number,
  offset: number,
  q: string,
  orderBy: string,
  createdBy: string,
  status: string | number,
  salesRep: string,
  dateCreatedBeginAt: string,
  dateCreatedEndAt: string,
  startValue: string,
  endValue: string
}

const sortByList: Array<SortByListProps> = [
  {
    name: 'Date Created',
    id: 'createdAt',
  },
  {
    name: 'Status',
    id: 'status',
  },
  {
    name: 'Updated',
    id: 'updatedAt',
  },
  {
    name: 'Expiration',
    id: 'expiredAt',
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
  defaultValue: 'createdAt',
  isFirstSelect: false,
  w: 150,
}

const quotesStatuses = [
  {
    customLabel: 'open',
    statusCode: 1,
  },
  {
    customLabel: 'ordered',
    statusCode: 4,
  },
  {
    customLabel: 'expired',
    statusCode: 5,
  },
]
const filterMoreList = [
  {
    name: 'status',
    label: 'Order status',
    required: false,
    default: '',
    fieldType: 'dropdown',
    options: quotesStatuses,
    replaceOptions: {
      label: 'customLabel',
      value: 'statusCode',
    },
    xs: 12,
    variant: 'filled',
    size: 'small',
  },
  {
    name: 'createdBy',
    label: 'Created by',
    required: false,
    default: '',
    fieldType: 'text',
    xs: 12,
    variant: 'filled',
    size: 'small',
  },
  {
    name: 'salesRep',
    label: 'Sales rep',
    required: false,
    default: '',
    fieldType: 'text',
    xs: 12,
    variant: 'filled',
    size: 'small',
  },
  // {
  //   name: 'dateCreatedBeginAt',
  //   label: 'Date created',
  //   required: false,
  //   default: '',
  //   fieldType: 'date',
  //   xs: 12,
  //   variant: 'filled',
  //   size: 'small',
  // },
]

const QuotesList = () => {
  const initSearch = {
    q: '',
    orderBy: '',
    createdBy: '',
    salesRep: '',
    status: '',
    dateCreatedBeginAt: distanceDay(30),
    dateCreatedEndAt: distanceDay(),
  }
  const [filterData, setFilterData] = useState<Partial<FilterSearchProps>>(initSearch)

  const [isRequestLoading, setIsRequestLoading] = useState(false)

  const navigate = useNavigate()

  const {
    state: {
      isB2BUser,
    },
  } = useContext(GlobaledContext)

  const goToDetail = (item: ListItem) => {
    navigate(`/quoteDetail/${item.id}?date=${item.createdAt}`)
  }

  const fetchList = async (params: Partial<FilterSearchProps>) => {
    const fn = isB2BUser ? getB2BQuotesList : getBCQuotesList
    const key = isB2BUser ? 'quotes' : 'customerQuotes'
    const {
      [key]: {
        edges = [],
        totalCount,
      },
    } = await fn(params)

    return {
      edges,
      totalCount,
    }
  }

  const columnAllItems: TableColumnItem<ListItem>[] = [
    {
      key: 'quoteNumber',
      title: 'Quote #',
      render: (item: ListItem) => (
        <Box
          component="span"
          sx={{
            cursor: 'pointer',
            '&:hover': {
              textDecoration: 'underline',
            },
          }}
          onClick={() => goToDetail(item)}
        >
          {item.quoteNumber}
        </Box>
      ),
    },
    {
      key: 'quoteTitle',
      title: 'Title',
    },
    {
      key: 'salesRepEmail',
      title: 'Sales rep',
    },
    {
      key: 'createdBy',
      title: 'Created by',
    },
    {
      key: 'createdAt',
      title: 'Date created',
      render: (item: ListItem) => format(+item.createdAt * 1000, 'dd MMM yy'),
    },
    {
      key: 'updatedAt',
      title: 'Last update',
      render: (item: ListItem) => format(+item.updatedAt * 1000, 'dd MMM yy'),
    },
    {
      key: 'expiredAt',
      title: 'Expiration date',
      render: (item: ListItem) => format(displayFormat(item.expiredAt, false), 'dd MMM yy'),
    },
    {
      key: 'subtotal',
      title: 'Subtotal',
      render: (item: ListItem) => {
        const {
          currency: {
            token,
          },
          subtotal,
        } = item

        return (`${token}${(+subtotal).toFixed(2)}`)
      },
    },
    {
      key: 'status',
      title: 'Status',
      render: (item: ListItem) => (<QuoteStatus code={item.status} />),
    },
  ]
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

  const handleFirterChange = (value: Partial<FilterSearchProps>) => {
    const search: Partial<FilterSearchProps> = {
      createdBy: value?.createdBy || '',
      status: value?.status || '',
      salesRep: value?.salesRep || '',
      dateCreatedBeginAt: value?.startValue || '',
      dateCreatedEndAt: value?.endValue || '',
    }

    setFilterData({
      ...filterData,
      ...search,
    })
  }

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
            fiterMoreInfo={filterMoreList}
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
            handleChange={handleChange}
            handleFilterChange={handleFirterChange}
          />
          <B3PaginationTable
            columnItems={columnAllItems}
            rowsPerPageOptions={[10, 20, 30]}
            getRequestList={fetchList}
            searchParams={filterData}
            isCustomRender={false}
            requestLoading={setIsRequestLoading}
            tableKey="quoteNumber"
            renderItem={(row: ListItem) => (
              <QuoteItemCard
                item={row}
                goToDetail={goToDetail}
              />
            )}
          />
        </Box>
      </B3Sping>
    )
  )
}

export default QuotesList
