import { useContext, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import globalB3 from '@b3/global-b3'
import {
  Box,
  Button,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material'
import { cloneDeep } from 'lodash'

import { B3Sping } from '@/components'
import { B3PaginationTable } from '@/components/table/B3PaginationTable'
import { TableColumnItem } from '@/components/table/B3Table'
import { useMobile } from '@/hooks'
import { GlobaledContext } from '@/shared/global'
import { exportInvoicesAsCSV, getInvoiceList } from '@/shared/service/b2b'
import { InvoiceList, InvoiceListNode } from '@/types/invoice'
import {
  currencyFormat,
  displayFormat,
  getActiveCurrencyInfo,
  getDefaultCurrencyInfo,
} from '@/utils'

import B3Filter from '../../components/filter/B3Filter'

import B3Pulldown from './components/B3Pulldown'
import InvoiceFooter from './components/InvoiceFooter'
import InvoiceStatus from './components/InvoiceStatus'
import PaymentsHistory from './components/PaymentsHistory'
import PaymentSuccess from './components/PaymentSuccess'
import PrintTempalte from './components/PrintTempalte'
import InvoiceListType, { filterFormConfig, sortIdArr } from './utils/config'
import { handlePrintPDF } from './utils/pdf'
// import { InvoiceItemCard } from './InvoiceItemCard'

export interface FilterSearchProps {
  [key: string]: string | number | null
  q: string
}

interface PaginationTableRefProps extends HTMLInputElement {
  getList: () => void
  getCacheList: () => void
  setCacheAllList: (items?: InvoiceList[]) => void
  setList: (items?: InvoiceListNode[]) => void
  getSelectedValue: () => void
}

const initFilter = {
  q: '',
  first: 10,
  offset: 0,
}

function Invoice() {
  const currentDate = new Date().getTime()
  const {
    state: { role, isAgenting },
  } = useContext(GlobaledContext)
  const navigate = useNavigate()
  const [isMobile] = useMobile()
  const paginationTableRef = useRef<PaginationTableRefProps | null>(null)

  const currentCurrency = globalB3?.setting?.is_local_debugging
    ? getDefaultCurrencyInfo()
    : getActiveCurrencyInfo()

  const [isRequestLoading, setIsRequestLoading] = useState<boolean>(false)
  const [isOpenHistorys, setIsOpenHistorys] = useState<boolean>(false)
  const [currentInvoiceId, setCurrentInvoiceId] = useState<string>('')
  const [receiptId, setReceiptId] = useState<string>('')
  const [type, setType] = useState<string>('')
  const [unpaidAmount, setUnpaidAmount] = useState<number>(0)
  const [overdueAmount, setOverdueAmount] = useState<number>(0)
  const [checkedArr, setCheckedArr] = useState<
    CustomFieldItems | InvoiceListNode[]
  >([])
  const [selectedPay, setSelectedPay] = useState<
    CustomFieldItems | InvoiceListNode[]
  >([])
  const [list, setList] = useState<InvoiceListNode[]>([])
  const [order, setOrder] = useState<'asc' | 'desc'>('desc')
  const [orderBy, setOrderBy] = useState<string>('id')

  const [filterData, setFilterData] =
    useState<Partial<FilterSearchProps> | null>()

  const location = useLocation()

  const handleStatisticsInvoiceAmount = (invoices: InvoiceListNode[]) => {
    let unpaidAmount = 0
    let overdueAmount = 0
    if (invoices.length > 0) {
      invoices.forEach((invoice: InvoiceListNode) => {
        const { node } = invoice
        const { status, dueDate, openBalance } = node

        if (status !== 2) {
          unpaidAmount += +openBalance.value
        }

        if (status !== 2 && currentDate > dueDate * 1000) {
          overdueAmount += +openBalance.value
        }
      })
    }
    setUnpaidAmount(+unpaidAmount.toFixed(2))
    setOverdueAmount(+overdueAmount.toFixed(2))
  }

  const handleChange = (key: string, value: string) => {
    if (key === 'search') {
      setFilterData({
        ...filterData,
        q: value,
      })
      setType(InvoiceListType.NORMAL)
    }
  }

  const handleFilterChange = (value: Partial<FilterSearchProps>) => {
    const startValue = value?.startValue
      ? new Date(value?.startValue).getTime() / 1000
      : ''
    const endValue = value?.endValue
      ? new Date(value?.endValue).getTime() / 1000
      : ''

    const search: Partial<FilterSearchProps> = {
      status: `${value?.status}` || '',
      beginDateAt: startValue,
      endDateAt: endValue,
    }

    setFilterData({
      ...filterData,
      ...search,
    })
    setType(InvoiceListType.NORMAL)
  }

  const getSelectCheckbox = (selectCheckbox: Array<string | number>) => {
    if (selectCheckbox.length > 0) {
      const productList = paginationTableRef.current?.getCacheList() || []

      const checkedItems = selectCheckbox.map((item: number | string) => {
        const newItems = productList.find((product: InvoiceListNode) => {
          const { node } = product

          return +node.id === +item
        })

        return newItems
      })

      setCheckedArr([...checkedItems])
    } else {
      setCheckedArr([])
    }
  }

  const handleViewInvoice = async (id: string) => {
    try {
      setIsRequestLoading(true)

      const pdfUrl = await handlePrintPDF(id, true)

      if (!pdfUrl) {
        console.error('pdf url resolution error')
        return
      }
      window.open(pdfUrl, '_blank', 'fullscreen=yes')
    } catch (err) {
      console.error(err)
    } finally {
      setIsRequestLoading(false)
    }
  }

  const handleSetSelectedInvoiceAccount = (
    newPrice: number | string,
    invoiceId: string
  ) => {
    const currentOriginInvoice = checkedArr.find((invoice: InvoiceListNode) => {
      const {
        node: { id },
      } = invoice

      return +id === +invoiceId
    })

    if (selectedPay.length > 0) {
      const newInvoices = selectedPay.map((selectedItem: InvoiceListNode) => {
        const {
          node: { id, openBalance },
        } = selectedItem
        const {
          node: { openBalance: currentOriginOpenBalance },
        } = currentOriginInvoice

        if (+id === +invoiceId) {
          openBalance.value =
            +currentOriginOpenBalance.value < +newPrice
              ? currentOriginOpenBalance.value
              : newPrice
        }

        return selectedItem
      })

      setSelectedPay(newInvoices)
    }
  }

  const handleExportInvoiceAsCSV = async () => {
    try {
      setIsRequestLoading(true)

      const params = {
        search: filterData?.q || '',
        invoiceNumber: filterData?.invoiceNumber || '',
        orderNumber: filterData?.orderNumber || '',
        beginDateAt: filterData?.beginDateAt || '',
        endDateAt: filterData?.endDateAt || '',
        status: filterData?.status || '',
      }

      const { invoicesExport } = await exportInvoicesAsCSV(params)

      if (invoicesExport?.url) {
        window.open(invoicesExport?.url, '_blank')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsRequestLoading(false)
    }
  }

  useEffect(() => {
    if (location?.search) {
      const params = new URLSearchParams(location.search)
      const getInvoiceId = params.get('invoiceId') || ''
      const getReceiptId = params.get('receiptId') || ''

      if (getInvoiceId) {
        setFilterData({
          ...initFilter,
          q: getInvoiceId,
        })
        setType(InvoiceListType.DETAIL)
      }

      if (getReceiptId) {
        // open Successful page
        setType(InvoiceListType.CHECKOUT)
        setFilterData({
          ...initFilter,
        })
        setReceiptId(getReceiptId)
      }
    } else {
      setType(InvoiceListType.NORMAL)
      setFilterData({
        ...initFilter,
      })
    }
  }, [location])

  useEffect(() => {
    const selectedInvoice =
      checkedArr.filter((item: InvoiceListNode) => {
        const {
          node: { openBalance },
        } = item

        return +openBalance.value !== 0
      }) || []

    if (selectedInvoice.length > 0) {
      if (selectedPay.length === 0) {
        setSelectedPay(cloneDeep(selectedInvoice))
      } else {
        const newArr = selectedInvoice.map((checkedItem: InvoiceListNode) => {
          const {
            node: { id, openBalance },
          } = checkedItem

          const currentSelectedItem = selectedPay.find(
            (item: InvoiceListNode) => {
              const {
                node: { id: selectedId },
              } = item

              return +id === +selectedId
            }
          )

          if (currentSelectedItem) {
            const {
              node: { openBalance: currentOpenBalance },
            } = currentSelectedItem

            openBalance.value = currentOpenBalance.value
          }

          return checkedItem
        })

        setSelectedPay(cloneDeep(newArr))
      }
    } else {
      setSelectedPay([])
    }
  }, [checkedArr])

  const fetchList = async (params: Partial<FilterSearchProps>) => {
    const {
      invoices: { edges, totalCount },
    } = await getInvoiceList(params)

    if (type === InvoiceListType.DETAIL && edges.length) {
      edges.forEach((item: InvoiceListNode) => {
        item.node.isCollapse = true
      })
    }

    edges.forEach((item: InvoiceListNode) => {
      const {
        node: { openBalance },
      } = item
      item.node.disableCurrentCheckbox = +openBalance.value === 0
    })
    setList(edges)
    handleStatisticsInvoiceAmount(edges)

    return {
      edges,
      totalCount,
    }
  }

  const handleSetOrderBy = (e: CustomFieldItems) => {
    const sortDirection = order === 'asc' ? 'desc' : 'asc'
    setOrder(sortDirection)
    setOrderBy(e.key)

    setFilterData({
      ...filterData,
      orderBy:
        sortDirection === 'asc'
          ? `${sortIdArr[e.key]}`
          : `-${sortIdArr[e.key]}`,
    })
  }

  const columnAllItems: TableColumnItem<InvoiceList>[] = [
    {
      key: 'id',
      title: 'Invoice',
      isSortable: true,
      render: (item: InvoiceList) => (
        <Box
          sx={{
            color: '#000000',
            cursor: 'pointer',
            ':hover': {
              textDecoration: 'underline',
            },
          }}
          onClick={() => {
            handleViewInvoice(item.id)
          }}
        >
          {item?.id || '-'}
        </Box>
      ),
      width: '8%',
    },
    {
      key: 'orderNumber',
      title: 'Order',
      isSortable: true,
      render: (item: InvoiceList) => (
        <Box
          sx={{
            color: '#000000',
            cursor: 'pointer',
            ':hover': {
              textDecoration: 'underline',
            },
          }}
          onClick={() => {
            navigate(`/orderDetail/${item.orderNumber}`)
          }}
        >
          {item?.orderNumber || '-'}
        </Box>
      ),
      width: '8%',
    },
    {
      key: 'createdAt',
      title: 'Invoice date',
      isSortable: true,
      render: (item: InvoiceList) =>
        `${item.createdAt ? displayFormat(+item.createdAt) : '–'}`,
      width: '10%',
    },
    {
      key: 'updatedAt',
      title: 'Due date',
      isSortable: true,
      render: (item: InvoiceList) => {
        const { dueDate, status } = item
        const isOverdue = currentDate > dueDate * 1000 && status !== 2

        return (
          <Typography
            sx={{
              color: isOverdue ? '#D32F2F' : 'rgba(0, 0, 0, 0.87)',
              fontSize: '14px',
            }}
          >
            {`${item.dueDate ? displayFormat(+item.dueDate) : '–'}`}
          </Typography>
        )
      },
      width: '10%',
    },
    {
      key: 'originalBalance',
      title: 'Invoice total',
      isSortable: true,
      render: (item: InvoiceList) => {
        const { originalBalance } = item
        const originalAmount = (+originalBalance.value).toFixed(2)

        return currencyFormat(+originalAmount || 0)
      },
      width: '10%',
    },
    {
      key: 'openBalance',
      title: 'Amount due',
      isSortable: true,
      render: (item: InvoiceList) => {
        const { openBalance } = item

        const openAmount = (+openBalance.value).toFixed(2)

        return currencyFormat(+openAmount || 0)
      },
      width: '10%',
    },
    {
      key: 'openBalanceToPay',
      title: 'Amount to pay',
      render: (item: InvoiceList) => {
        const { openBalance, id } = item
        let valuePrice = +openBalance.value
        let disabled = true

        if (selectedPay.length > 0) {
          const currentSelected = selectedPay.find((item: InvoiceListNode) => {
            const {
              node: { id: selectedId },
            } = item

            return +selectedId === +id
          })

          if (currentSelected) {
            const {
              node: { openBalance: selectedOpenBalance },
            } = currentSelected

            disabled = false
            valuePrice = +selectedOpenBalance.value

            if (+openBalance.value === 0) {
              disabled = true
            }
          }
        }

        return (
          <TextField
            disabled={disabled}
            variant="filled"
            value={valuePrice}
            InputProps={{
              startAdornment: (
                <InputAdornment
                  position="start"
                  sx={{ padding: '8px 0', marginTop: '0 !important' }}
                >
                  {currentCurrency.token}
                </InputAdornment>
              ),
            }}
            sx={{
              '& input': {
                paddingTop: '8px',
              },
            }}
            onChange={(e: CustomFieldItems) =>
              handleSetSelectedInvoiceAccount(e.target?.value, id)
            }
            type="number"
          />
        )
      },
      width: '15%',
    },
    {
      key: 'status',
      title: 'Status',
      render: (item: InvoiceList) => {
        const { status, dueDate } = item
        let code = item.status

        // (3, "Overdue")-【Display status when invoice exceeds due date. For front-end display only】
        if (status !== 2 && currentDate > dueDate * 1000) {
          code = 3
        }

        return <InvoiceStatus code={code} />
      },
    },
    {
      key: 'companyName',
      title: 'Action',
      render: (row: InvoiceList) => (
        <B3Pulldown
          row={row}
          setInvoiceId={setCurrentInvoiceId}
          handleOpenHistoryModal={setIsOpenHistorys}
          setIsRequestLoading={setIsRequestLoading}
        />
      ),
      width: '10%',
    },
  ]

  return (
    <B3Sping isSpinning={isRequestLoading}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          position: 'relative',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'flex-start' : 'center',
            flexDirection: isMobile ? 'column' : 'row',
          }}
        >
          <B3Filter
            fiterMoreInfo={filterFormConfig}
            handleChange={handleChange}
            handleFilterChange={handleFilterChange}
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
            searchValue={filterData?.q || ''}
          />
          <Box
            sx={{
              display: 'flex',
              marginBottom: '30px',
              flexDirection:
                document.body.clientWidth <= 465 ? 'column' : 'row',
            }}
          >
            <Typography
              sx={{
                fontSize: '24px',
                color: '#000000',
              }}
            >
              {`Open: ${currencyFormat(unpaidAmount)}`}
            </Typography>
            {document.body.clientWidth >= 465 && (
              <Typography
                sx={{
                  fontSize: '24px',
                  margin: '0 8px',
                }}
              >
                |
              </Typography>
            )}
            <Typography
              sx={{
                fontSize: '24px',
                color: '#D32F2F',
              }}
            >
              {`Overdue: ${currencyFormat(overdueAmount)}`}
            </Typography>
          </Box>
        </Box>
        <B3PaginationTable
          ref={paginationTableRef}
          columnItems={columnAllItems}
          rowsPerPageOptions={[10, 20, 30]}
          getRequestList={fetchList}
          searchParams={filterData}
          isCustomRender={false}
          requestLoading={setIsRequestLoading}
          tableKey="id"
          showCheckbox
          showSelectAllCheckbox={!isMobile}
          disableCheckbox={false}
          applyAllDisableCheckbox={false}
          getSelectCheckbox={getSelectCheckbox}
          CollapseComponent={PrintTempalte}
          sortDirection={order}
          orderBy={orderBy}
          sortByFn={handleSetOrderBy}
          isSelectOtherPageCheckbox
          hover
          // renderItem={(
          //   row: InvoiceList,
          //   index?: number,
          //   checkBox?: () => ReactElement
          // ) => (
          //   <InvoiceItemCard
          //     item={row}
          //     checkBox={checkBox}
          //     handleSetSelectedInvoiceAccount={handleSetSelectedInvoiceAccount}
          //     handleViewInvoice={handleViewInvoice}
          //     setIsRequestLoading={setIsRequestLoading}
          //     setInvoiceId={setCurrentInvoiceId}
          //     handleOpenHistoryModal={setIsOpenHistorys}
          //     currentCurrencyToken={currentCurrency.token}
          //     selectedPay={selectedPay}
          //   />
          // )}
        />
        {list.length > 0 && !isMobile && (
          <Box
            sx={{
              position: 'absolute',
              bottom: '8px',
              left: '20px',
            }}
          >
            <Button variant="text" onClick={handleExportInvoiceAsCSV}>
              Export all as csv file
            </Button>
          </Box>
        )}
      </Box>
      {selectedPay.length > 0 && (role === 0 || isAgenting) && (
        <InvoiceFooter selectedPay={selectedPay} />
      )}
      <PaymentsHistory
        open={isOpenHistorys}
        currentInvoiceId={currentInvoiceId}
        setOpen={setIsOpenHistorys}
      />
      <PaymentSuccess receiptId={+receiptId} type={type} />
    </B3Sping>
  )
}

export default Invoice
