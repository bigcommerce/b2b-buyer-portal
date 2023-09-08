import styled from '@emotion/styled'
import { useTheme } from '@mui/material'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'

import { TableColumnItem } from '@/components/table/B3Table'
import { currencyFormat, displayFormat } from '@/utils'

import QuoteStatus from './QuoteStatus'

interface ListItem {
  [key: string]: string | Object
  status: string
  quoteNumber: string
}

export interface QuoteItemCardProps {
  goToDetail: (val: ListItem, status: number) => void
  item: ListItem
}

const Flex = styled('div')(() => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'start',
  marginBottom: '1rem',
}))

export function QuoteItemCard(props: QuoteItemCardProps) {
  const { item, goToDetail } = props
  const theme = useTheme()

  const primaryColor = theme.palette.primary.main

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
      render: () =>
        `${
          +item.status !== 0 ? displayFormat(+item.createdAt) : item.createdAt
        }`,
    },
    {
      key: 'updatedAt',
      title: 'Last update',
      render: () =>
        `${
          +item.status !== 0 ? displayFormat(+item.updatedAt) : item.updatedAt
        }`,
    },
    {
      key: 'expiredAt',
      title: 'Expiration date',
      render: () =>
        `${
          +item.status !== 0 ? displayFormat(+item.expiredAt) : item.expiredAt
        }`,
    },
    {
      key: 'totalAmount',
      title: 'Subtotal',
      render: () => {
        const { totalAmount } = item

        return `${currencyFormat(+totalAmount)}`
      },
    },
  ]

  return (
    <Card>
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

        {columnAllItems.map((list: any) => (
          <Box
            key={list.key}
            sx={{
              display: 'flex',
            }}
          >
            <Typography
              sx={{
                fontWeight: 'bold',
                color: 'rgba(0, 0, 0, 0.87)',
                mr: '5px',
                whiteSpace: 'nowrap',
              }}
            >
              {`${list.title}:`}
            </Typography>
            <Typography
              sx={{
                color: 'black',
                wordBreak: 'break-all',
              }}
            >
              {list?.render ? list.render() : item[list.key]}
            </Typography>
          </Box>
        ))}

        <Box
          onClick={() => goToDetail(item, +item.status)}
          sx={{
            mt: '1rem',
            pl: 0,
            color: primaryColor || '#1976D2',
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
