import {
  useNavigate,
} from 'react-router-dom'
import {
  Box,
  Button,
} from '@mui/material'

import {
  useMobile,
} from '@/hooks'

interface QuoteDetailFooterProps {
  quoteId: string,
  quoteDate: string,
}

const QuoteDetailFooter = (props: QuoteDetailFooterProps) => {
  const {
    quoteId,
    quoteDate,
  } = props
  const [isMobile] = useMobile()
  const navigate = useNavigate()

  const containerStyle = isMobile ? {
    alignItems: 'flex-end',
    flexDirection: 'column',
  } : {
    alignItems: 'center',
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
        zIndex: '10',
        justifyContent: isMobile ? 'center' : 'flex-end',
        displayPrint: 'none',
        ...containerStyle,
      }}
    >
      <Button
        variant="contained"
        onClick={() => {
          navigate('/checkout')
          localStorage.setItem('quoteCheckoutId', quoteId)
          localStorage.setItem('quoteDate', quoteDate)
          console.log('proceed to checkout')
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
