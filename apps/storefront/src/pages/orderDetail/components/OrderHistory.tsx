import { useContext } from 'react'
import { useSelector } from 'react-redux'
import styled from '@emotion/styled'
import { Card, CardContent, Typography } from '@mui/material'
import { intlFormatDistance } from 'date-fns'

import { B3Table, TableColumnItem } from '@/components/table/B3Table'
import { useMobile } from '@/hooks'
import { RootState } from '@/store'

import { OrderHistoryItem, OrderStatusItem } from '../../../types'
import OrderStatus from '../../order/components/OrderStatus'
import { OrderDetailsContext } from '../context/OrderDetailsContext'

const HistoryListContainer = styled('div')(() => ({
  '& > .MuiPaper-root': {
    boxShadow: 'none',
  },
}))

export default function OrderHistory() {
  const {
    state: { history = [], orderStatus: orderStatusLabel = [] },
  } = useContext(OrderDetailsContext)

  const lang = useSelector(({ lang }: RootState) => lang)
  const [isMobile] = useMobile()

  const getTime = (time: number) =>
    intlFormatDistance(new Date(time * 1000), new Date(), {
      locale: lang,
    })

  const getOrderStatusLabel = (status: string) =>
    orderStatusLabel.find(
      (item: OrderStatusItem) => item.systemLabel === status
    )?.customLabel || status

  const columnItems: TableColumnItem<OrderHistoryItem>[] = [
    {
      key: 'time',
      title: 'Date',
      render: (item: OrderHistoryItem) => getTime(item.createdAt),
      width: isMobile ? ' 100px' : '150px',
    },
    {
      key: 'code',
      title: 'Status',
      render: (item: OrderHistoryItem) => (
        <OrderStatus
          code={item.status}
          text={getOrderStatusLabel(item.status)}
        />
      ),
    },
  ]

  return history.length > 0 ? (
    <Card>
      <CardContent
        sx={{
          paddingBottom: '50px',
        }}
      >
        <Typography
          variant="h5"
          sx={{
            padding: '0 16px',
          }}
        >
          History
        </Typography>
        <HistoryListContainer>
          <B3Table
            columnItems={columnItems}
            listItems={history}
            showPagination={false}
          />
        </HistoryListContainer>
      </CardContent>
    </Card>
  ) : null
}
