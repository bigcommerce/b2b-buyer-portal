import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

import styled from '@emotion/styled'

import {
  format,
} from 'date-fns'
import {
  TableColumnItem,
} from '@/components/table/B3Table'

import {
  QuoteStatus,
} from './QuoteStatus'

interface ListItem {
  [key: string]: string | Object
  status: string,
  quoteNumber: string,
  currency: {
    token: string
  }
}

export interface QuoteItemCardProps {
  goToDetail: (val: ListItem) => void,
  item: any,
}

const Flex = styled('div')(() => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'start',
  marginBottom: '1rem',
}))

export const QuoteItemCard = (props: QuoteItemCardProps) => {
  const {
    item,
    goToDetail,
  } = props

  const columnAllItems: TableColumnItem<ListItem>[] = [
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
      render: () => format(+item.createdAt * 1000, 'dd MMM yy'),
    },
    {
      key: 'updatedAt',
      title: 'Last update',
      render: () => format(+item.updatedAt * 1000, 'dd MMM yy'),
    },
    {
      key: 'expiredAt',
      title: 'Expiration date',
      render: () => format(+item.expiredAt * 1000, 'dd MMM yy'),
    },
    {
      key: 'totalAmount',
      title: 'Subtotal',
      render: () => {
        const {
          currency: {
            token,
          },
          totalAmount,
        } = item

        return (`${token}${(+totalAmount).toFixed(2)}`)
      },
    },
  ]

  return (
    <Card
      key={item.orderId}
    >
      <CardContent
        sx={{
          color: 'rgba(0, 0, 0, 0.6)',
        }}
      >
        <Flex>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              mb: '1rem',
            }}
          >
            <Typography
              variant="h6"
              sx={{
                color: 'rgba(0, 0, 0, 0.87)',
              }}
            >
              {item.quoteNumber}
            </Typography>
          </Box>
          <Box>
            <QuoteStatus code={item.status} />
          </Box>

        </Flex>

        {
          columnAllItems.map((list: any) => (
            <Box
              sx={{
                display: 'flex',
              }}
            >
              <Typography
                sx={{
                  fontWeight: 'bold',
                  color: 'rgba(0, 0, 0, 0.87)',
                  mr: '5px',
                }}
              >
                {`${list.title}:`}
              </Typography>
              <Typography
                sx={{
                  color: 'black',
                }}
              >
                {list?.render ? list.render() : item[list.key]}
              </Typography>
            </Box>

          ))
        }

        <Box
          onClick={() => goToDetail(item)}
          sx={{
            mt: '1rem',
            pl: 0,
            color: '#1976D2',
            cursor: 'pointer',
            fontWeight: 'bold',
            display: 'inline-block',
          }}
        >
          VIEW
        </Box>

      </CardContent>
    </Card>
  )
}
