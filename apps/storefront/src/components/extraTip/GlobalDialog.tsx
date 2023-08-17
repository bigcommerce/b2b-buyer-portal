import { useDispatch, useSelector } from 'react-redux'
import { Box } from '@mui/material'

import useMobile from '@/hooks/useMobile'

import { globalStateSelector, setGlabolCommonState } from '../../store'
// const B3Dialog = lazy(() => import('../B3Dialog'))
import B3Dialog from '../B3Dialog'

function GlobalDialog() {
  const { globalMessage } = useSelector(globalStateSelector)

  const [isMobile] = useMobile()

  const storeDispatch = useDispatch()

  const messageDialogClose = () => {
    storeDispatch(
      setGlabolCommonState({
        globalMessage: {
          open: false,
          title: '',
          message: '',
          cancelText: 'Cancel',
        },
      })
    )
  }

  const handleSaveMessage = () => {
    if (globalMessage?.saveFn) globalMessage.saveFn()
    messageDialogClose()
  }

  return (
    <Box
      sx={{
        fontFamily: '"Roboto","Helvetica","Arial",sans-serif',
        fontWeight: '400',
        fontSize: '1rem',
      }}
    >
      <B3Dialog
        isOpen={globalMessage?.open || false}
        title={globalMessage?.title || ''}
        leftSizeBtn={globalMessage?.cancelText || 'cancel'}
        rightSizeBtn={globalMessage?.saveText || 'save'}
        handleLeftClick={globalMessage?.cancelFn || messageDialogClose}
        handRightClick={handleSaveMessage}
        showRightBtn={!!globalMessage?.saveText}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: `${isMobile ? 'center' : 'start'}`,
            width: `${isMobile ? '100%' : '450px'}`,
            height: '100%',
          }}
        >
          {globalMessage?.message || ''}
        </Box>
      </B3Dialog>
    </Box>
  )
}

export default GlobalDialog
