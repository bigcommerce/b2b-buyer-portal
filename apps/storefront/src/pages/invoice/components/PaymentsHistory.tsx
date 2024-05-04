import { useEffect, useState } from 'react'
import { useB3Lang } from '@b3/lang'
import { Box, Card, CardContent, Typography } from '@mui/material'

import { B3NoData } from '@/components'
import B3Dialog from '@/components/B3Dialog'
import B3Sping from '@/components/spin/B3Sping'
import { useMobile } from '@/hooks'
import { getInvoicePaymentHistory } from '@/shared/service/b2b'
import { displayFormat, handleGetCorrespondingCurrency } from '@/utils'

interface PaymentsHistoryProps {
  open: boolean
  setOpen: (bool: boolean) => void
  currentInvoiceId: string
}

interface PaymentsHistoryList {
  node: InvoiceData
}

interface InvoiceData {
  id: string
  paymentType: string
  invoiceId: number
  amount: {
    code: string
    value: string
  }
  transactionType: string
  referenceNumber: string
  createdAt: number
}

function Title({ title }: { title: string }) {
  return (
    <Typography
      sx={{
        fontWeight: 'bold',
        pr: '5px',
      }}
    >
      {title}:
    </Typography>
  )
}

function HistoryList({ list }: { list: PaymentsHistoryList[] }) {
  return (
    <>
      {list.map((item: PaymentsHistoryList) => {
        const {
          node: {
            createdAt,
            amount,
            paymentType,
            transactionType,
            referenceNumber,
            id,
          },
        } = item

        return (
          <Card
            key={id}
            sx={{
              mb: '10px',
            }}
          >
            <CardContent
              sx={{
                color: '#313440',
                wordBreak: 'break-word',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                }}
              >
                <Title title="Date received" />
                <Typography variant="body1">{`${displayFormat(
                  +createdAt
                )}`}</Typography>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                }}
              >
                <Title title="Amount" />
                <Typography variant="body1">
                  {`${handleGetCorrespondingCurrency(
                    amount.code,
                    +(amount?.value || 0)
                  )}`}
                </Typography>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                }}
              >
                <Title title="Transaction type" />
                <Typography variant="body1">{transactionType}</Typography>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                }}
              >
                <Title title="Payment type" />
                <Typography variant="body1">{paymentType}</Typography>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                }}
              >
                <Title title="Reference" />
                <Typography variant="body1">
                  {referenceNumber || '–'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        )
      })}
    </>
  )
}

function PaymentsHistory({
  open,
  setOpen,
  currentInvoiceId,
}: PaymentsHistoryProps) {
  const b3Lang = useB3Lang()
  const [isMobile] = useMobile()
  const [loadding, setLoadding] = useState<boolean>(false)

  const [list, setList] = useState<PaymentsHistoryList[] | []>([])

  useEffect(() => {
    const init = async () => {
      setLoadding(true)
      const {
        allReceiptLines: { edges = [] },
      } = await getInvoicePaymentHistory(+currentInvoiceId)

      setList(edges)
      setLoadding(false)
    }

    if (open && currentInvoiceId) {
      init()
    }
  }, [open, currentInvoiceId])

  return (
    <B3Dialog
      isOpen={open}
      leftSizeBtn=""
      rightSizeBtn="ok"
      title={b3Lang('invoice.paymentHistory.title')}
      showLeftBtn={false}
      handRightClick={() => setOpen(false)}
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
            {list.length ? <HistoryList list={list} /> : <B3NoData />}
          </Box>
        </B3Sping>
      </Box>
    </B3Dialog>
  )
}

export default PaymentsHistory
