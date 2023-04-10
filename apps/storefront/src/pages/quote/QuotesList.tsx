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
  useMobile,
} from '@/hooks'

import {
  getB2BQuotesList,
  getBCQuotesList,
  getShoppingListsCreatedByUser,
} from '@/shared/service/b2b'

import {
  B3Sping,
} from '@/components/spin/B3Sping'

// import {
//   displayFormat,
// } from '@/utils/b3DateFormat'

import B3Filter from '../../components/filter/B3Filter'

import {
  QuoteStatus,
} from './components/QuoteStatus'

import {
  QuoteItemCard,
} from './components/QuoteItemCard'

import {
  getDefaultCurrencyInfo,
  B3LStorage,
} from '@/utils'

import {
  addPrice,
} from './shared/config'

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
    customLabel: 'Open',
    statusCode: 1,
  },
  {
    customLabel: 'Ordered',
    statusCode: 4,
  },
  {
    customLabel: 'Expired',
    statusCode: 5,
  },
]

const getFilterMoreList = (isB2BUser: boolean, createdByUsers: any) => {
  const newCreatedByUsers = createdByUsers?.createdByUser?.results?.createdBy.map((item: any) => ({
    createdBy: item.email ? `${item.name} (${item.email})` : `${item.name}`,
  })) || []
  const newCreatedBySalesReps = createdByUsers?.createdByUser?.results?.salesRep.map((item: any) => ({
    salesRep: `${item.salesRep || item.salesRepEmail}`,
  })) || []
  const filterMoreList = [
    {
      name: 'status',
      label: 'Quote status',
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
      fieldType: 'dropdown',
      options: newCreatedByUsers,
      replaceOptions: {
        label: 'createdBy',
        value: 'createdBy',
      },
      xs: 12,
      variant: 'filled',
      size: 'small',
    },
    {
      name: 'salesRep',
      label: 'Sales rep',
      required: false,
      default: '',
      fieldType: 'dropdown',
      options: newCreatedBySalesReps,
      replaceOptions: {
        label: 'salesRep',
        value: 'salesRep',
      },
      xs: 12,
      variant: 'filled',
      size: 'small',
    },
  ]

  const filterCurrentMoreList = filterMoreList.filter((item) => {
    if (!isB2BUser && (item.name === 'createdBy' || item.name === 'salesRep')) return false
    return true
  })

  return filterCurrentMoreList
}

const QuotesList = () => {
  const initSearch = {
    q: '',
    orderBy: '',
    createdBy: '',
    salesRep: '',
    status: '',
    dateCreatedBeginAt: '',
    dateCreatedEndAt: '',
  }
  const [filterData, setFilterData] = useState<Partial<FilterSearchProps>>(initSearch)

  const [isRequestLoading, setIsRequestLoading] = useState(false)

  const [filterMoreInfo, setFilterMoreInfo] = useState<Array<any>>([])

  const navigate = useNavigate()

  const [isMobile] = useMobile()

  const {
    state: {
      isB2BUser,
      customer,
      companyInfo: {
        id: companyB2BId,
      },
      salesRepCompanyId,
    },
  } = useContext(GlobaledContext)

  useEffect(() => {
    const initFilter = async () => {
      const companyId = companyB2BId || salesRepCompanyId
      let createdByUsers: CustomFieldItems = {}
      if (isB2BUser) createdByUsers = await getShoppingListsCreatedByUser(+companyId, 2)

      const filterInfos = getFilterMoreList(isB2BUser, createdByUsers)
      setFilterMoreInfo(filterInfos)
    }

    initFilter()
  }, [])

  const goToDetail = (item: ListItem, status: number) => {
    if (+status === 0) {
      navigate('/quoteDraft')
    } else {
      navigate(`/quoteDetail/${item.id}?date=${item.createdAt}`)
    }
  }

  const {
    token: currencyToken,
  } = getDefaultCurrencyInfo()

  const fetchList = async (params: Partial<FilterSearchProps>) => {
    const fn = isB2BUser ? getB2BQuotesList : getBCQuotesList
    const key = isB2BUser ? 'quotes' : 'customerQuotes'
    const {
      [key]: {
        edges = [],
        totalCount,
      },
    } = await fn(params)

    const quoteDraftAllList = B3LStorage.get('b2bQuoteDraftList') || []
    if (params.offset === 0 && quoteDraftAllList.length) {
      const summaryPrice = addPrice()

      // const price = quoteDraftAllList.reduce((pre: number, cur: CustomFieldItems) => pre + (cur.node.basePrice * cur.node.quantity), 0)
      const quoteDraft = {
        node: {
          quoteNumber: '—',
          quoteTitle: '—',
          createdAt: '—',
          salesRepEmail: '—',
          createdBy: `${customer.firstName} ${customer.lastName}`,
          updatedAt: '—',
          expiredAt: '—',
          currency: {
            token: currencyToken,
          },
          totalAmount: summaryPrice?.subtotal,
          status: 0,
          taxTotal: summaryPrice?.tax,
        },
      }

      const {
        status,
        createdBy,
        salesRep,
        dateCreatedBeginAt,
        dateCreatedEndAt,
      } = filterData

      const showDraft = !status && !salesRep && !dateCreatedBeginAt && !dateCreatedEndAt

      if (createdBy && showDraft) {
        const getCreatedByReg: RegExp = /^[^(]+/
        const createdByUserRegArr = getCreatedByReg.exec(createdBy)
        const createdByUser = createdByUserRegArr?.length ? createdByUserRegArr[0].trim() : ''
        if (createdByUser === quoteDraft.node.createdBy) edges.unshift(quoteDraft)
      } else if (showDraft) {
        edges.unshift(quoteDraft)
      }
    }

    return {
      edges,
      totalCount,
    }
  }

  const columnAllItems: TableColumnItem<ListItem>[] = [
    {
      key: 'quoteNumber',
      title: 'Quote #',
    },
    {
      key: 'quoteTitle',
      title: 'Title',
    },
    {
      key: 'salesRep',
      title: 'Sales rep',
      render: (item: ListItem) => (`${item.salesRep || item.salesRepEmail}`),
    },
    {
      key: 'createdBy',
      title: 'Created by',
    },
    {
      key: 'createdAt',
      title: 'Date created',
      render: (item: ListItem) => (`${+item.status !== 0 ? format(+item.createdAt * 1000, 'dd MMM yyyy') : item.createdAt}`),
    },
    {
      key: 'updatedAt',
      title: 'Last update',
      render: (item: ListItem) => (`${+item.status !== 0 ? format(+item.updatedAt * 1000, 'dd MMM yyyy') : item.updatedAt}`),
    },
    {
      key: 'expiredAt',
      title: 'Expiration date',
      render: (item: ListItem) => (`${+item.status !== 0 ? format(+item.expiredAt * 1000, 'dd MMM yyyy') : item.expiredAt}`),
    },
    {
      key: 'totalAmount',
      title: 'Subtotal',
      render: (item: ListItem) => {
        const {
          currency: {
            token,
          },
          totalAmount,
          taxTotal,
        } = item

        return (`${token}${(+totalAmount + +taxTotal).toFixed(2)}`)
      },
      style: {
        textAlign: 'right',
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
            fiterMoreInfo={filterMoreInfo}
            startPicker={{
              isEnabled: true,
              label: 'From',
              defaultValue: filterData?.dateCreatedBeginAt || '',
              pickerKey: 'start',
            }}
            endPicker={{
              isEnabled: true,
              label: 'To',
              defaultValue: filterData?.dateCreatedEndAt || '',
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
            labelRowsPerPage={`${isMobile ? 'Cards per page' : 'Quotes per page'}`}
            renderItem={(row: ListItem) => (
              <QuoteItemCard
                item={row}
                goToDetail={goToDetail}
              />
            )}
            onClickRow={(row: ListItem) => {
              goToDetail(row, +row.status)
            }}
            hover
          />
        </Box>
      </B3Sping>
    )
  )
}

export default QuotesList
