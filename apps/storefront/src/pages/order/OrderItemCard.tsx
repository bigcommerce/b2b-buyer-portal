import { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from '@emotion/styled'
import { useTheme } from '@mui/material'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'

import { GlobaledContext } from '@/shared/global'
import { currencyFormat, displayFormat } from '@/utils'

import OrderStatus from './components/OrderStatus'

interface ListItem {
  [key: string]: string
}

export interface OrderItemCardProps {
  allTotal: number
  filterData: any
  index?: number
  item: ListItem
  isCompanyOrder: boolean
}

const Flex = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  '&.between-flex': {
    justifyContent: 'space-between',
  },
}))

export function OrderItemCard(props: OrderItemCardProps) {
  const { item, allTotal, filterData, index = 0, isCompanyOrder } = props

  const theme = useTheme()

  const {
    state: { customer, isB2BUser },
  } = useContext(GlobaledContext)

  const navigate = useNavigate()

  const goToDetail = (item: ListItem) => {
    navigate(`/orderDetail/${item.orderId}`, {
      state: {
        currentIndex: index || 0,
        searchParams: filterData,
        totalCount: allTotal,
        isCompanyOrder,
      },
    })
  }

  const getName = (item: ListItem) => {
    if (isB2BUser) {
      return `by ${item.firstName} ${item.lastName}`
    }
    return `by ${customer.firstName} ${customer.lastName}`
  }

  return (
    <Card key={item.orderId}>
      <CardContent
        sx={{
          color: 'rgba(0, 0, 0, 0.6)',
        }}
        onClick={() => goToDetail(item)}
      >
        <Flex className="between-flex">
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Typography
              variant="h5"
              sx={{
                color: 'rgba(0, 0, 0, 0.87)',
              }}
            >
              {`# ${item.orderId}`}
            </Typography>
            <Typography
              sx={{
                ml: 1,
              }}
              variant="body2"
            >
              {item.poNumber ? item.poNumber : '–'}
            </Typography>
          </Box>
          <Box>
            <OrderStatus code={item.status} />
          </Box>
        </Flex>

        <Typography
          variant="h6"
          sx={{
            marginBottom: theme.spacing(2.5),
            mt: theme.spacing(1.5),
            minHeight: '1.43em',
          }}
        >
          {currencyFormat(item.totalIncTax)}
        </Typography>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontWeight: 'normal',
              marginRight: theme.spacing(2),
            }}
          >
            {getName(item)}
          </Typography>
          <Typography>{`${displayFormat(item.createdAt)}`}</Typography>
        </Box>
      </CardContent>
    </Card>
  )
}
