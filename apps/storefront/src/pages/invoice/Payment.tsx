import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import { useB3Lang } from '@b3/lang'
import { Box } from '@mui/material'

import { B3Dialog, Loading } from '@/components'
import { getInvoiceDetail } from '@/shared/service/b2b'
import { globalStateSelector } from '@/store'
import { B3SStorage, snackbar } from '@/utils'

import { gotoInvoiceCheckoutUrl } from './utils/payment'

function Payment() {
  const globalState = useSelector(globalStateSelector)

  const [loadding, setLoadding] = useState<boolean>(false)

  const [open, setOpen] = useState<boolean>(false)

  const params = useParams()

  const navigate = useNavigate()

  const b3Lang = useB3Lang()

  useEffect(() => {
    const init = async () => {
      setLoadding(true)
      const B2BToken = B3SStorage.get('B2BToken')

      if (!B2BToken) {
        setOpen(true)
        setLoadding(false)
        return
      }

      if (!params?.id) {
        snackbar.error(b3Lang('payment.errorInvoiceCantBeBlank'))
      }

      if (params?.id) {
        try {
          const {
            invoice: {
              openBalance: { code = '', value = '' },
            },
          } = await getInvoiceDetail(+params.id)

          if (!code || !value) {
            snackbar.error(b3Lang('payment.errorOpenBalanceIsIncorrect'))
          }

          const data = {
            lineItems: [
              {
                invoiceId: +params.id,
                amount: value,
              },
            ],
            currency: code,
          }

          await gotoInvoiceCheckoutUrl(
            data,
            globalState.storeInfo.platform,
            true
          )
        } catch (error: unknown) {
          snackbar.error(
            (error as CustomFieldItems)?.message ||
              b3Lang('payment.invoiceDoesntExist')
          )
        } finally {
          setLoadding(false)
        }
      }
    }

    init()
  }, [params.id])

  const handleConfirm = () => {
    navigate('/login')
  }

  return (
    <Box>
      {loadding && <Loading backColor="#FFFFFF" />}
      <B3Dialog
        isOpen={open}
        fullWidth
        title=""
        rightSizeBtn="ok"
        showLeftBtn={false}
        handRightClick={handleConfirm}
      >
        <Box
          sx={{
            height: '200px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
          }}
        >
          <Box>
            <Box
              sx={{
                mb: '10px',
              }}
            >
              {b3Lang('payment.firstLoginToPay')}
            </Box>
            <Box>{b3Lang('payment.clickToLandingPage')}</Box>
          </Box>
        </Box>
      </B3Dialog>
    </Box>
  )
}

export default Payment
