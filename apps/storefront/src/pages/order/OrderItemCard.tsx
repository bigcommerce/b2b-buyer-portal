import {
  useContext,
} from 'react'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

import styled from '@emotion/styled'

import {
  useTheme,
} from '@mui/material'

import {
  useNavigate,
} from 'react-router-dom'

import {
  format,
} from 'date-fns'
import {
  GlobaledContext,
} from '@/shared/global'

import {
  OrderStatus,
} from './components/OrderStatus'

import {
  currencySymbol,
} from './config'

interface ListItem {
  [key: string]: string
}

export interface OrderItemCardProps {
  pagination: any,
  filterData: any,
  index: number,
  item: ListItem,
  isCompanyOrder: boolean,
}

const Flex = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  '&.between-flex': {
    justifyContent: 'space-between',
  },
}))

export const OrderItemCard = (props: OrderItemCardProps) => {
  const {
    item,
    pagination,
    filterData,
    index,
    isCompanyOrder,
  } = props

  const theme = useTheme()

  const {
    state: {
      customer,
      isB2BUser,
    },
  } = useContext(GlobaledContext)

  const navigate = useNavigate()

  const goToDetail = (item: ListItem) => {
    navigate(`/orderDetail/${item.orderId}`, {
      state: {
        currentIndex: index,
        searchParams: filterData,
        totalCount: pagination.count,
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
    <Card
      key={item.orderId}
    >
      <CardContent
        sx={{
          color: 'rgba(0, 0, 0, 0.6)',
        }}
      >
        <Flex className="between-flex">
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Typography
              variant="h6"
              sx={{
                color: 'rgba(0, 0, 0, 0.87)',
              }}
              onClick={() => goToDetail(item)}
            >
              {`# ${item.orderId}`}
            </Typography>
            <Typography
              sx={{
                ml: 1,
              }}
              variant="body2"
            >
              {item.poNumber ? item.poNumber : '-'}
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
          {currencySymbol(item.money)}
          {item.totalIncTax}
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
          <Typography>
            {format(+item.createdAt * 1000, 'dd MMM yy')}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  )
}
