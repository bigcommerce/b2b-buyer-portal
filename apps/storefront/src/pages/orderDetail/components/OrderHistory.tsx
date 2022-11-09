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
  TableColumnItem,
  B3Table,
} from '@/components/B3Table'

import {
  OrderStatus,
} from '../../order/components'

import {
  OrderHistoryItem,
} from '../shared/B2BOrderData'

interface OrderHistoryProps {
  history: OrderHistoryItem[]
}

const HistoryListContainer = styled('div')(() => ({
  '& > .MuiPaper-root': {
    boxShadow: 'none',
  },
}))

export const OrderHistory = (props: OrderHistoryProps) => {
  const {
    history,
  } = props

  const [lang] = useB3CurrentLang()

  const getTime = (time: number) => intlFormatDistance(new Date(time * 1000), new Date(), {
    locale: lang,
  })

  const columnItems: TableColumnItem<OrderHistoryItem>[] = [{
    key: 'time',
    title: 'Date',
    render: (item: OrderHistoryItem) => getTime(item.createdAt),
    width: '150px',
  },
  {
    key: 'code',
    title: 'Status',
    render: (item: OrderHistoryItem) => <OrderStatus code={item.status} />,
  }]

  return (
    history.length > 0 ? (
      <Card>
        <CardContent>
          <Typography variant="h4">History</Typography>
          <HistoryListContainer>
            <B3Table
              columnItems={columnItems}
              listItems={history}
              showPagination={false}
            />
          </HistoryListContainer>
        </CardContent>
      </Card>
    )
      : <></>
  )
}
