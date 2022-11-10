import {
  useContext,
} from 'react'

import {
  Card,
  CardContent,
  Typography,
} from '@mui/material'

import styled from '@emotion/styled'

import {
  intlFormatDistance,
} from 'date-fns'

import {
  useB3CurrentLang,
} from '@b3/lang'

import {
  useMobile,
} from '@/hooks'

import {
  TableColumnItem,
  B3Table,
} from '@/components/B3Table'

import {
  OrderStatus,
} from '../../order/components'

import {
  OrderHistoryItem,
} from '../shared/B2BOrderData'

import {
  OrderDetailsContext,
} from '../context/OrderDetailsContext'

const HistoryListContainer = styled('div')(() => ({
  '& > .MuiPaper-root': {
    boxShadow: 'none',
  },
}))

export const OrderHistory = () => {
  const {
    state: {
      history,
      orderStatus: orderStatusLabel,
    },
  } = useContext(OrderDetailsContext)

  const [lang] = useB3CurrentLang()
  const [isMobile] = useMobile()

  const getTime = (time: number) => intlFormatDistance(new Date(time * 1000), new Date(), {
    locale: lang,
  })

  const getOrderStatusLabel = (status: string) => orderStatusLabel.find((item: any) => item.systemLabel === status)?.customLabel || status

  const columnItems: TableColumnItem<OrderHistoryItem>[] = [{
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
  }]

  return (
    history.length > 0 ? (
      <Card>
        <CardContent>
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
    ) : <></>
  )
}
