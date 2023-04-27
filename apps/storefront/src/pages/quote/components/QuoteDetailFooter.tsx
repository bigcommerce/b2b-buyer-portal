import { Box } from '@mui/material'

import { CustomButton } from '@/components'
import { useMobile } from '@/hooks'
import { b2bQuoteCheckout, bcQuoteCheckout } from '@/shared/service/b2b'

interface QuoteDetailFooterProps {
  quoteId: string
  role: string | number
  isAgenting: boolean
  status: number
}

function QuoteDetailFooter(props: QuoteDetailFooterProps) {
  const { quoteId, role, isAgenting, status } = props
  const [isMobile] = useMobile()

  const containerStyle = isMobile
    ? {
        alignItems: 'flex-end',
        flexDirection: 'column',
      }
    : {
        alignItems: 'center',
      }

  const handleQuoteCheckout = async () => {
    try {
      const fn = +role === 99 ? bcQuoteCheckout : b2bQuoteCheckout

      const res = await fn({
        id: +quoteId,
      })

      const {
        quoteCheckout: {
          quoteCheckout: { checkoutUrl },
        },
      } = res

      window.location.href = checkoutUrl
    } catch (err) {
      console.error(err)
    }
  }

  return status !== 5 ? (
    <Box
      sx={{
        position: 'fixed',
        bottom: isMobile && isAgenting ? '52px' : 0,
        left: 0,
        backgroundColor: '#fff',
        width: '100%',
        padding: '0.8rem 1rem',
        height: 'auto',
        display: 'flex',
        zIndex: '999',
        justifyContent: isMobile ? 'center' : 'flex-end',
        displayPrint: 'none',
        ...containerStyle,
      }}
    >
      <CustomButton
        variant="contained"
        onClick={() => {
          handleQuoteCheckout()
        }}
        sx={{
          width: isMobile ? '100%' : 'auto',
        }}
      >
        Proceed to checkout
      </CustomButton>
    </Box>
  ) : null
}

export default QuoteDetailFooter
