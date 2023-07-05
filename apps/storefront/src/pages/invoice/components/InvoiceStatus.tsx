import { B3Tag } from '@/components'

interface StatusProps {
  code: number
}

interface InvoiceStatusProps {
  [key: string]: {
    [key: string]: string
  }
}

export default function InvoiceStatus(props: StatusProps) {
  const { code } = props

  const getInvoiceStatus = (code: number) => {
    const invoiceStatus: InvoiceStatusProps = {
      0: {
        textColor: '#000000',
        name: 'Open',
        color: '#F1C224',
      },
      1: {
        textColor: '#FFFFFF',
        name: 'Partially paid',
        color: '#516FAE',
      },
      2: {
        textColor: '#000000',
        name: 'Paid',
        color: '#C4DD6C',
      },
      3: {
        textColor: '#FFFFFF',
        name: 'Overdue',
        color: '#D32F2F',
      },
    }

    const statusInfo = invoiceStatus[code] || {}

    return statusInfo
  }

  const status = getInvoiceStatus(code)

  return status.name ? (
    <B3Tag color={status.color} textColor={status.textColor}>
      {status.name}
    </B3Tag>
  ) : null
}
