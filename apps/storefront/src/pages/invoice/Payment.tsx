import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Box } from '@mui/material'

import { B3Dialog, Loading } from '@/components'
import { getInvoiceDetail } from '@/shared/service/b2b'
import { B3SStorage, snackbar } from '@/utils'

import { gotoInvoiceCheckoutUrl } from './utils/payment'

function Payment() {
  const [loadding, setLoadding] = useState<boolean>(false)

  const [open, setOpen] = useState<boolean>(false)

  const params = useParams()

  const navigate = useNavigate()

  useEffect(() => {
    const init = async () => {
      setLoadding(true)
      const B3B2BToken = B3SStorage.get('B3B2BToken')

      if (!B3B2BToken) {
        setOpen(true)
        setLoadding(false)
        return
      }

      if (!params?.id) {
        snackbar.error('The invoice cannot be blank')
      }

      if (params?.id) {
        try {
          const {
            invoice: {
              openBalance: { code = '', value = '' },
            },
          } = await getInvoiceDetail(+params.id)

          if (!code || !value) {
            snackbar.error('The invoice openBalance code or value is incorrect')
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

          await gotoInvoiceCheckoutUrl(data, true)
        } catch (errer: unknown) {
          snackbar.error(
            (errer as CustomFieldItems)?.message || 'Invoice does not exist'
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
              Please log in first and pay the invoice,
            </Box>
            <Box>Click ok to go to the landing page</Box>
          </Box>
        </Box>
      </B3Dialog>
    </Box>
  )
}

export default Payment
