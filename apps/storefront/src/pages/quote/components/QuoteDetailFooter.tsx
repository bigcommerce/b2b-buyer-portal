import {
  Box,
  Button,
} from '@mui/material'

import {
  useMobile,
} from '@/hooks'

import {
  b2bQuoteCheckout,
  bcQuoteCheckout,
} from '@/shared/service/b2b'

import {
  snackbar,
} from '@/utils'

interface QuoteDetailFooterProps {
  quoteId: string,
  role: string | number,
}

const QuoteDetailFooter = (props: QuoteDetailFooterProps) => {
  const {
    quoteId,
    role,
  } = props
  const [isMobile] = useMobile()

  const containerStyle = isMobile ? {
    alignItems: 'flex-end',
    flexDirection: 'column',
  } : {
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
          quoteCheckout: {
            checkoutUrl,
          },
        },
      } = res

      window.location.href = checkoutUrl
    } catch (err: any) {
      snackbar.error(err)
    }
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
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
      <Button
        variant="contained"
        onClick={() => {
          handleQuoteCheckout()
        }}
        sx={{
          width: isMobile ? '100%' : 'auto',
        }}
      >
        Proceed to checkout
      </Button>
    </Box>

  )
}

export default QuoteDetailFooter
