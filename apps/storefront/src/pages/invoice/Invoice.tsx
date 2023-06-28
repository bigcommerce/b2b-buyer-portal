import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Box } from '@mui/material'

import { B3Sping } from '@/components'
import { B3PaginationTable } from '@/components/table/B3PaginationTable'
import { TableColumnItem } from '@/components/table/B3Table'
import { getInvoiceList } from '@/shared/service/b2b'
import { InvoiceList, InvoiceListNode } from '@/types/invoice'

import B3Pulldown from './components/B3Pulldown'
import PaymentsHistory from './components/PaymentsHistory'
import PaymentSuccess from './components/PaymentSuccess'
import PrintTempalte from './components/PrintTempalte'
import InvoiceListType from './utils/config'

export interface FilterSearchProps {
  [key: string]: string | number | null
  q: string
}

const initFilter = {
  q: '',
  first: 10,
  offset: 0,
}

function Invoice() {
  const [isRequestLoading, setIsRequestLoading] = useState<boolean>(false)

  const [isOpenHistorys, setIsOpenHistorys] = useState<boolean>(false)

  const [currentInvoiceId, setCurrentInvoiceId] = useState<string>('')

  const [receiptId, setReceiptId] = useState<string>('')

  const [type, setType] = useState<string>('')

  const [filterData, setFilterData] =
    useState<Partial<FilterSearchProps> | null>()

  const location = useLocation()

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

  const fetchList = async (params: Partial<FilterSearchProps>) => {
    const {
      invoices: { edges, totalCount },
    } = await getInvoiceList(params)

    if (type === InvoiceListType.DETAIL && edges.length) {
      edges.forEach((item: InvoiceListNode) => {
        item.node.isCollapse = true
      })
    }

    return {
      edges,
      totalCount,
    }
  }

  const columnAllItems: TableColumnItem<InvoiceList>[] = [
    {
      key: 'id',
      title: 'id',
      // width: '10%',
    },
    {
      key: 'createdAt',
      title: 'createdAt',
      render: (item: InvoiceList) => (
        <Box>{item.createdAt ? item.createdAt : '–'}</Box>
      ),
      // width: '10%',
    },
    {
      key: 'updatedAt',
      title: 'updatedAt',
      render: (item: InvoiceList) => (
        <Box>{item.createdAt ? item.createdAt : '–'}</Box>
      ),
      // width: '50%',
      style: {
        textAlign: 'right',
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
    },
  ]

  return (
    <B3Sping isSpinning={isRequestLoading}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
        }}
      >
        <B3PaginationTable
          columnItems={columnAllItems}
          rowsPerPageOptions={[10, 20, 30]}
          getRequestList={fetchList}
          searchParams={filterData}
          isCustomRender={false}
          requestLoading={setIsRequestLoading}
          tableKey="id"
          CollapseComponent={PrintTempalte}
          // renderItem={(row: ListItem, index?: number) => (
          //   <OrderItemCard
          //     key={row.orderId}
          //     item={row}
          //     index={index}
          //     allTotal={allTotal}
          //     filterData={filterData}
          //     isCompanyOrder={isCompanyOrder}
          //   />
          // )}
          hover
        />
      </Box>
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
