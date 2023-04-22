import {
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from 'react'
import type { OpenPageState } from '@b3/hooks'
import { Box, Button, Snackbar, SnackbarOrigin, SxProps } from '@mui/material'

import { CustomStyleContext } from '@/shared/customStyleButtton'
import { B3LStorage } from '@/utils'

import {
  getContrastColor,
  getLocation,
  getStyles,
} from './utils/b3CustomStyles'

interface B3HoverButtonProps {
  isOpen: boolean
  productQuoteEnabled: boolean
  setOpenPage: Dispatch<SetStateAction<OpenPageState>>
}

export default function B3HoverButton(props: B3HoverButtonProps) {
  const { isOpen, setOpenPage, productQuoteEnabled } = props

  const [showFinishQuote, setShowFinishQuote] = useState<boolean>(false)

  const b2bQuoteDraftList = B3LStorage.get('b2bQuoteDraftList')

  useEffect(() => {
    if (b2bQuoteDraftList?.length) {
      setShowFinishQuote(true)
    } else setShowFinishQuote(false)
  }, [isOpen, b2bQuoteDraftList])

  const { href } = window.location

  const {
    state: { floatingAction },
  } = useContext(CustomStyleContext)

  const {
    text = '',
    color = '',
    customCss = '',
    location = '',
    horizontalPadding = '',
    verticalPadding = '',
    enabled = false,
  } = floatingAction

  const defaultLocation: SnackbarOrigin = {
    vertical: 'bottom',
    horizontal: 'right',
  }

  const defaultSx: SxProps = {
    backgroundColor: `${color}`,
    color: getContrastColor(color),
    padding: `${verticalPadding}px ${horizontalPadding}px`,
    ...getStyles(customCss),
  }

  if (href.includes('/checkout')) return null
  return (
    <Snackbar
      sx={{
        zIndex: '110000',
        width: 'auto',
      }}
      anchorOrigin={getLocation(location) || defaultLocation}
      open
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          width: 'auto',
        }}
      >
        {enabled &&
          showFinishQuote &&
          !isOpen &&
          productQuoteEnabled &&
          !href.includes('/cart') && (
            <Button
              sx={{
                backgroundColor: '#ED6C02',
                height: '42px',
                ...defaultSx,
              }}
              onClick={() => {
                setOpenPage({
                  isOpen: true,
                  openUrl: '/quoteDraft',
                  params: {
                    quoteBtn: 'open',
                  },
                })
              }}
              variant="contained"
            >
              {text || 'Finish quote'}
            </Button>
          )}
      </Box>
    </Snackbar>
  )
}
