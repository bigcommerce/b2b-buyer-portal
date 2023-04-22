import { B3Tag } from '@/components'

interface OrderStatusProps {
  code: string
}

interface QuoteStatussProps {
  [key: string]: {
    [key: string]: string
  }
}

export default function QuoteStatus(props: OrderStatusProps) {
  const { code } = props

  const getOrderStatus = (code: string) => {
    const quoteStatus: QuoteStatussProps = {
      0: {
        textColor: 'rgba(0, 0, 0, 0.87)',
        name: 'Draft',
        color: '#D8D6D1',
      },
      1: {
        textColor: 'rgba(0, 0, 0, 0.87)',
        name: 'Open',
        color: '#F1C224',
      },
      4: {
        textColor: 'rgba(0, 0, 0, 0.87)',
        name: 'Ordered',
        color: '#C4DD6C',
      },
      5: {
        textColor: '#fff',
        name: 'Expired',
        color: '#BD3E1E',
      },
    }

    const statusInfo = quoteStatus[code] || {}

    return statusInfo
  }

  const status = getOrderStatus(code)

  return status.name ? (
    <B3Tag color={status.color} textColor={status.textColor}>
      {status.name}
    </B3Tag>
  ) : null
}
