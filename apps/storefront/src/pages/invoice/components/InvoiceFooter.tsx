import { useContext, useEffect, useState } from 'react'
import { Box, Button, Grid, Typography } from '@mui/material'

import { useMobile } from '@/hooks'
import { GlobaledContext } from '@/shared/global'
import {
  BcCartData,
  BcCartDataLineItem,
  InvoiceListNode,
} from '@/types/invoice'
import { currencyFormat } from '@/utils'

import { gotoInvoiceCheckoutUrl } from '../utils/payment'

interface InvoiceFooterProps {
  selectedPay: CustomFieldItems
}

function InvoiceFooter(props: InvoiceFooterProps) {
  const [isMobile] = useMobile()
  const [selectedAccount, setSelectedAccount] = useState<number>(0)

  const {
    state: { isAgenting },
  } = useContext(GlobaledContext)

  const containerStyle = isMobile
    ? {
        alignItems: 'flex-start',
        flexDirection: 'column',
      }
    : {
        alignItems: 'center',
      }

  const { selectedPay } = props

  const handleStatisticsInvoiceAmount = (checkedArr: CustomFieldItems) => {
    let amount = 0

    checkedArr.forEach((item: InvoiceListNode) => {
      const {
        node: { openBalance },
      } = item
      amount += +openBalance.value
    })

    setSelectedAccount(+amount.toFixed(2))
  }

  const handlePay = async () => {
    const lineItems: BcCartDataLineItem[] = []
    let currency = 'SGD'

    if (selectedPay.length > 0) {
      selectedPay.forEach((item: InvoiceListNode) => {
        const {
          node: { id, openBalance, originalBalance },
        } = item

        lineItems.push({
          invoiceId: +id,
          amount: openBalance.value,
        })

        currency = openBalance?.code || originalBalance.code
      })

      const params: BcCartData = {
        lineItems,
        currency,
      }

      await gotoInvoiceCheckoutUrl(params)
    }
  }

  useEffect(() => {
    if (selectedPay.length > 0) {
      handleStatisticsInvoiceAmount(selectedPay)
    }
  }, [selectedPay])

  return (
    <Grid
      sx={{
        position: 'fixed',
        bottom: isMobile && isAgenting ? '52px' : 0,
        left: 0,
        backgroundColor: '#fff',
        width: '100%',
        padding: isMobile ? '0 0 1rem 0' : '0 40px 1rem 40px',
        height: isMobile ? '8rem' : 'auto',
        marginLeft: 0,
        display: 'flex',
        flexWrap: 'nowrap',
        zIndex: '999',
      }}
      container
      spacing={2}
    >
      <Grid
        item
        sx={{
          display: isMobile ? 'none' : 'block',
          width: '290px',
          paddingLeft: '20px',
        }}
      />
      <Grid
        item
        sx={
          isMobile
            ? {
                flexBasis: '100%',
              }
            : {
                flexBasis: '690px',
                flexGrow: 1,
              }
        }
      >
        <Box
          sx={{
            width: '100%',
            pr: '20px',
            display: 'flex',
            zIndex: '999',
            justifyContent: 'space-between',
            ...containerStyle,
          }}
        >
          <Typography
            sx={{
              color: '#000000',
              fontSize: '16px',
              fontWeight: '400',
            }}
          >
            {`${selectedPay.length} invoices selected`}
          </Typography>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: isMobile ? 'wrap' : 'nowrap',
              width: isMobile ? '100%' : 'auto',
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontSize: '16px',
                fontWeight: '700',
                color: '#000000',
              }}
            >
              {`Total payment: ${currencyFormat(selectedAccount)}`}
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                marginTop: isMobile ? '0.5rem' : 0,
                width: isMobile ? '100%' : 'auto',
              }}
            >
              <Button
                variant="contained"
                sx={{
                  marginLeft: isMobile ? 0 : '1rem',
                  width: isMobile ? '100%' : 'auto',
                }}
                onClick={() => {
                  handlePay()
                }}
              >
                Pay invoices
              </Button>
            </Box>
          </Box>
        </Box>
      </Grid>
      <Grid
        item
        sx={
          isMobile
            ? {
                flexBasis: '100%',
                display: isMobile ? 'none' : 'block',
              }
            : {
                flexBasis: '0',
                display: isMobile ? 'none' : 'block',
              }
        }
      />
    </Grid>
  )
}

export default InvoiceFooter
