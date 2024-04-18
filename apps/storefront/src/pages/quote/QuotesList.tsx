import { useCallback, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LangFormatFunction, useB3Lang } from '@b3/lang'
import { Box } from '@mui/material'

import { B3Sping } from '@/components'
import { B3PaginationTable } from '@/components/table/B3PaginationTable'
import { TableColumnItem } from '@/components/table/B3Table'
import { useMobile, useSort } from '@/hooks'
import { GlobaledContext } from '@/shared/global'
import {
  getB2BQuotesList,
  getBCQuotesList,
  getShoppingListsCreatedByUser,
} from '@/shared/service/b2b'
import { isB2BUserSelector, useAppSelector } from '@/store'
import { currencyFormatConvert, displayFormat } from '@/utils'

import B3Filter from '../../components/filter/B3Filter'

import { QuoteItemCard } from './components/QuoteItemCard'
import QuoteStatus from './components/QuoteStatus'
import { addPrice } from './shared/config'

interface ListItem {
  [key: string]: string | Object
  status: string
  quoteNumber: string
}

interface FilterSearchProps {
  first: number
  offset: number
  q: string
  orderBy: string
  createdBy: string
  status: string | number
  salesRep: string
  dateCreatedBeginAt: string
  dateCreatedEndAt: string
  startValue: string
  endValue: string
}

const quotesStatuses = [
  {
    idLangCustomLabel: 'quotes.open',
    statusCode: 1,
  },
  {
    idLangCustomLabel: 'quotes.ordered',
    statusCode: 4,
  },
  {
    idLangCustomLabel: 'quotes.expired',
    statusCode: 5,
  },
]

const getFilterMoreList = (
  isB2BUser: boolean,
  createdByUsers: any,
  b3Lang: LangFormatFunction
) => {
  const newCreatedByUsers =
    createdByUsers?.createdByUser?.results?.createdBy.map((item: any) => ({
      createdBy: item.email ? `${item.name} (${item.email})` : `${item.name}`,
    })) || []
  const newCreatedBySalesReps =
    createdByUsers?.createdByUser?.results?.salesRep.map((item: any) => ({
      salesRep: `${item.salesRep || item.salesRepEmail}`,
    })) || []
  const filterMoreList = [
    {
      name: 'status',
      label: b3Lang('quotes.quoteStatus'),
      required: false,
      default: '',
      fieldType: 'dropdown',
      options: quotesStatuses.map(
        ({ idLangCustomLabel, ...restQuoteStatuses }) => ({
          customLabel: b3Lang(idLangCustomLabel),
          ...restQuoteStatuses,
        })
      ),
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
      label: b3Lang('quotes.createdBy'),
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
      label: b3Lang('quotes.salesRep'),
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
    if (!isB2BUser && (item.name === 'createdBy' || item.name === 'salesRep'))
      return false
    return true
  })

  return filterCurrentMoreList
}

const defaultSortKey = 'quoteNumber'

const sortKeys = {
  quoteNumber: 'quoteNumber',
  quoteTitle: 'quoteTitle',
  salesRep: 'salesRep',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  expiredAt: 'expiredAt',
  status: 'status',
}

function QuotesList() {
  const initSearch = {
    q: '',
    orderBy: `-${sortKeys[defaultSortKey]}`,
    createdBy: '',
    salesRep: '',
    status: '',
    dateCreatedBeginAt: '',
    dateCreatedEndAt: '',
  }
  const [filterData, setFilterData] =
    useState<Partial<FilterSearchProps>>(initSearch)

  const [isRequestLoading, setIsRequestLoading] = useState(false)

  const [filterMoreInfo, setFilterMoreInfo] = useState<Array<any>>([])

  const [handleSetOrderBy, order, orderBy] = useSort(
    sortKeys,
    defaultSortKey,
    filterData,
    setFilterData
  )

  const navigate = useNavigate()

  const b3Lang = useB3Lang()

  const [isMobile] = useMobile()

  const companyB2BId = useAppSelector(({ company }) => company.companyInfo.id)
  const customer = useAppSelector(({ company }) => company.customer)
  const {
    state: { openAPPParams, currentChannelId },
    dispatch,
  } = useContext(GlobaledContext)

  const isB2BUser = useAppSelector(isB2BUserSelector)
  const draftQuoteListLength = useAppSelector(
    ({ quoteInfo }) => quoteInfo.draftQuoteList.length
  )
  const salesRepCompanyId = useAppSelector(
    ({ b2bFeatures }) => b2bFeatures.masqueradeCompany.id
  )

  useEffect(() => {
    const initFilter = async () => {
      const companyId = companyB2BId || salesRepCompanyId
      let createdByUsers: CustomFieldItems = {}
      if (isB2BUser)
        createdByUsers = await getShoppingListsCreatedByUser(+companyId, 2)

      const filterInfos = getFilterMoreList(isB2BUser, createdByUsers, b3Lang)
      setFilterMoreInfo(filterInfos)
    }

    initFilter()

    if (openAPPParams.quoteBtn) {
      dispatch({
        type: 'common',
        payload: {
          openAPPParams: {
            quoteBtn: '',
            shoppingListBtn: '',
          },
        },
      })
    }
    // disabling as we only need to run this once and values at starting render are good enough
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const goToDetail = (item: ListItem, status: number) => {
    if (+status === 0) {
      navigate('/quoteDraft')
    } else {
      navigate(`/quoteDetail/${item.id}?date=${item.createdAt}`)
    }
  }

  const fetchList = useCallback(
    async (params: Partial<FilterSearchProps>) => {
      const fn = isB2BUser ? getB2BQuotesList : getBCQuotesList
      const key = isB2BUser ? 'quotes' : 'customerQuotes'
      const {
        [key]: { edges = [], totalCount },
      } = await fn({ ...params, currentChannelId })

      if (params.offset === 0 && draftQuoteListLength) {
        const summaryPrice = addPrice()

        const quoteDraft = {
          node: {
            quoteNumber: '—',
            quoteTitle: '—',
            createdAt: '—',
            salesRepEmail: '—',
            createdBy: `${customer.firstName} ${customer.lastName}`,
            updatedAt: '—',
            expiredAt: '—',
            totalAmount: summaryPrice?.grandTotal,
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

        const showDraft =
          !status && !salesRep && !dateCreatedBeginAt && !dateCreatedEndAt

        if (createdBy && showDraft) {
          const getCreatedByReg = /^[^(]+/
          const createdByUserRegArr = getCreatedByReg.exec(createdBy)
          const createdByUser = createdByUserRegArr?.length
            ? createdByUserRegArr[0].trim()
            : ''
          if (createdByUser === quoteDraft.node.createdBy)
            edges.unshift(quoteDraft)
        } else if (showDraft) {
          edges.unshift(quoteDraft)
        }
      }

      return {
        edges,
        totalCount,
      }
    },
    [
      draftQuoteListLength,
      currentChannelId,
      customer.firstName,
      customer.lastName,
      filterData,
      isB2BUser,
    ]
  )

  const columnAllItems: TableColumnItem<ListItem>[] = [
    {
      key: 'quoteNumber',
      title: b3Lang('quotes.quoteNumber'),
      isSortable: true,
    },
    {
      key: 'quoteTitle',
      title: b3Lang('quotes.title'),
      isSortable: true,
    },
    {
      key: 'salesRep',
      title: b3Lang('quotes.salesRep'),
      render: (item: ListItem) => `${item.salesRep || item.salesRepEmail}`,
      isSortable: true,
    },
    {
      key: 'createdBy',
      title: b3Lang('quotes.createdBy'),
      isSortable: true,
    },
    {
      key: 'createdAt',
      title: b3Lang('quotes.dateCreated'),
      render: (item: ListItem) =>
        `${
          +item.status !== 0 ? displayFormat(+item.createdAt) : item.createdAt
        }`,
      isSortable: true,
    },
    {
      key: 'updatedAt',
      title: b3Lang('quotes.lastUpdate'),
      render: (item: ListItem) =>
        `${
          +item.status !== 0 ? displayFormat(+item.updatedAt) : item.updatedAt
        }`,
      isSortable: true,
    },
    {
      key: 'expiredAt',
      title: b3Lang('quotes.expirationDate'),
      render: (item: ListItem) =>
        `${
          +item.status !== 0 ? displayFormat(+item.expiredAt) : item.expiredAt
        }`,
      isSortable: true,
    },
    {
      key: 'totalAmount',
      title: b3Lang('quotes.subtotal'),
      render: (item: ListItem) => {
        const { totalAmount, currency } = item
        const newCurrency = currency as CurrencyProps
        return `${currencyFormatConvert(+totalAmount, {
          currency: newCurrency,
        })}`
      },
      style: {
        textAlign: 'right',
      },
    },
    {
      key: 'status',
      title: b3Lang('quotes.status'),
      render: (item: ListItem) => <QuoteStatus code={item.status} />,
      isSortable: true,
    },
  ]

  const handleChange = (key: string, value: string) => {
    if (key === 'search') {
      setFilterData({
        ...filterData,
        q: value,
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
    <B3Sping isSpinning={isRequestLoading}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
        }}
      >
        <B3Filter
          fiterMoreInfo={filterMoreInfo}
          startPicker={{
            isEnabled: true,
            label: b3Lang('quotes.from'),
            defaultValue: filterData?.dateCreatedBeginAt || '',
            pickerKey: 'start',
          }}
          endPicker={{
            isEnabled: true,
            label: b3Lang('quotes.to'),
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
          sortDirection={order}
          orderBy={orderBy}
          sortByFn={handleSetOrderBy}
          labelRowsPerPage={`${
            isMobile
              ? b3Lang('quotes.cardsPerPage')
              : b3Lang('quotes.quotesPerPage')
          }`}
          renderItem={(row: ListItem) => (
            <QuoteItemCard item={row} goToDetail={goToDetail} />
          )}
          onClickRow={(row: ListItem) => {
            goToDetail(row, +row.status)
          }}
          hover
        />
      </Box>
    </B3Sping>
  )
}

export default QuotesList
