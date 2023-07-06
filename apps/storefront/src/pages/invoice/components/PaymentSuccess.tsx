import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Button, Typography } from '@mui/material'

import { B3Dialog, B3NoData, B3Sping } from '@/components'
import { useMobile } from '@/hooks'
import { getInvoicePaymentInfo } from '@/shared/service/b2b'
import { InvoiceSuccessData, ReceiptLineSet } from '@/types/invoice'
import { currencyFormat, displayFormat } from '@/utils'

import InvoiceListType from '../utils/config'

interface PaymentSuccessKeysProps {
  key: string
  label: string
  type: string
  isRow: boolean
}

function Title({
  title,
  withColon = true,
}: {
  title: string
  withColon?: boolean
}) {
  return (
    <Typography
      sx={{
        fontWeight: 'bold',
        pr: '5px',
      }}
    >
      {withColon ? `${title}:` : title}
    </Typography>
  )
}

interface RowProps {
  isRow?: boolean
  type: string
  value: string | number
  label: string
}
function Row({ isRow = true, type = '', value, label }: RowProps) {
  const getNewVal = (): string | number | Date => {
    if (type === 'time') {
      return displayFormat(+value) || ''
    }
    if (type === 'currency') {
      return currencyFormat(+(value || 0))
    }
    return value || '–'
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: isRow ? 'row' : 'column',
      }}
    >
      <Title title={label} />
      <Typography variant="body1">{`${getNewVal()}`}</Typography>
    </Box>
  )
}

function PaymentSuccessList({ list }: { list: InvoiceSuccessData }) {
  const {
    receiptLineSet: { edges = [] },
    details,
  } = list

  const memo = details?.paymentDetails?.memo || ''

  const paymentSuccessKeys = [
    {
      key: 'paymentId',
      label: 'Payment#',
      type: '',
      isRow: true,
    },
    {
      key: 'createdAt',
      label: 'Payment received on',
      type: 'time',
      isRow: true,
    },
    {
      key: 'transactionType',
      label: 'Transaction type',
      type: '',
      isRow: true,
    },
    {
      key: 'paymentType',
      label: 'Payment type',
      type: '',
      isRow: true,
    },
    {
      key: 'totalAmount',
      label: 'Payment Total',
      type: 'currency',
      isRow: true,
    },
    {
      key: 'referenceNumber',
      label: 'Reference',
      type: '',
      isRow: true,
    },
  ]

  return (
    <Box>
      {paymentSuccessKeys.map((item: PaymentSuccessKeysProps) => (
        <Row
          isRow={!!item.isRow}
          type={item.type}
          value={(list as CustomFieldItems)[item.key]}
          label={item.label}
        />
      ))}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          mb: '30px',
        }}
      >
        <Title title="Payment comment" />
        <Typography
          sx={{
            maxHeight: '50px',
          }}
        >
          {memo}
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Title title="Invoices paid" withColon={false} />
        <Typography variant="body1">
          Yo made payments towards the invoices shown below{' '}
        </Typography>
      </Box>

      <Box>
        <Box
          sx={{
            borderBottom: '1px solid #D9DCE9',
            padding: '20px 15px',
            display: 'flex',
            justifyContent: 'space-between',
            fontWeight: 500,
          }}
        >
          <Typography
            sx={{
              fontSize: '14px',
              fontWeight: '500',
              color: '#000000',
            }}
          >
            Invoice#
          </Typography>
          <Typography
            sx={{
              fontSize: '14px',
              fontWeight: '500',
              color: '#000000',
            }}
          >
            Amount paid
          </Typography>
        </Box>
        {edges.map((item: ReceiptLineSet) => {
          const {
            invoiceNumber,
            amount: { value },
          } = item.node
          return (
            <Box
              sx={{
                borderBottom: '1px solid #D9DCE9',
                padding: '20px 15px',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <Typography>{invoiceNumber}</Typography>
              <Typography>{`${currencyFormat(+(value || 0))}`}</Typography>
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}

interface PaymentSuccessProps {
  receiptId: number | number
  type: string
}

function PaymentSuccess({ receiptId, type }: PaymentSuccessProps) {
  const [isMobile] = useMobile()
  const [loadding, setLoadding] = useState<boolean>(false)

  const [open, setOpen] = useState<boolean>(false)

  const [detailData, setDetailData] = useState<InvoiceSuccessData | null>(null)

  const navigate = useNavigate()

  useEffect(() => {
    const init = async () => {
      setLoadding(true)
      const { receipt } = await getInvoicePaymentInfo(+receiptId)

      setDetailData(receipt)
      setOpen(true)
      setLoadding(false)
    }

    if (type === InvoiceListType.CHECKOUT && receiptId) {
      init()
    }
  }, [receiptId, type])

  const handleCloseClick = () => {
    setOpen(false)
    navigate('/invoice')
  }
  const customActions = () => (
    <Button onClick={handleCloseClick} variant="text">
      ok
    </Button>
  )

  return (
    <B3Dialog
      isOpen={open}
      leftSizeBtn=""
      customActions={customActions}
      title="Thank you for your payment"
      showLeftBtn={false}
    >
      <Box
        sx={{
          width: isMobile ? '100%' : `${'384px'}`,
          maxHeight: '600px',
        }}
      >
        <B3Sping isSpinning={loadding}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
            }}
          >
            {detailData ? (
              <PaymentSuccessList list={detailData} />
            ) : (
              <B3NoData />
            )}
          </Box>
        </B3Sping>
      </Box>
    </B3Dialog>
  )
}

export default PaymentSuccess
