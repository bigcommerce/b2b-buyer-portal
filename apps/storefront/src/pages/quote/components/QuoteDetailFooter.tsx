import { useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'
import { useB3Lang } from '@b3/lang'
import { Box } from '@mui/material'

import { CustomButton } from '@/components'
import { useMobile } from '@/hooks'
import { b2bQuoteCheckout, bcQuoteCheckout } from '@/shared/service/b2b'
import { globalStateSelector } from '@/store'
import { getSearchVal } from '@/utils'
import {
  attemptCheckoutLoginAndRedirect,
  setQuoteToStorage,
} from '@/utils/b3checkout'

interface QuoteDetailFooterProps {
  quoteId: string
  role: string | number
  isAgenting: boolean
  status: number
  proceedingCheckoutFn: () => boolean
}

function QuoteDetailFooter(props: QuoteDetailFooterProps) {
  const { quoteId, role, isAgenting, status, proceedingCheckoutFn } = props
  const globalState = useSelector(globalStateSelector)
  const [isMobile] = useMobile()
  const b3Lang = useB3Lang()
  const location = useLocation()

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
      const isHideQuoteCheckout = proceedingCheckoutFn()
      if (isHideQuoteCheckout) return

      const fn = +role === 99 ? bcQuoteCheckout : b2bQuoteCheckout
      const date = getSearchVal(location.search, 'date')

      const res = await fn({
        id: +quoteId,
      })

      setQuoteToStorage(quoteId, date)
      const {
        quoteCheckout: {
          quoteCheckout: { checkoutUrl, cartId },
        },
      } = res

      if (globalState.storeInfo.platform === 'bigcommerce') {
        window.location.href = checkoutUrl
        return
      }

      await attemptCheckoutLoginAndRedirect(cartId, checkoutUrl as string)
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
        {b3Lang('quoteDetail.footer.proceedToCheckout')}
      </CustomButton>
    </Box>
  ) : null
}

export default QuoteDetailFooter
