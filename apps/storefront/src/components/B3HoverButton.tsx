import {
  Dispatch,
  SetStateAction,
  useState,
  useEffect,
} from 'react'

import {
  Box,
  Button,
  Snackbar,
} from '@mui/material'

import type {
  OpenPageState,
} from '@b3/hooks'

import {
  B3LStorage,
} from '@/utils'

interface B3HoverButtonProps {
  isOpen: boolean,
  productQuoteEnabled: boolean,
  setOpenPage: Dispatch<SetStateAction<OpenPageState>>,
}

export const B3HoverButton = (props: B3HoverButtonProps) => {
  const {
    isOpen,
    setOpenPage,
    productQuoteEnabled,
  } = props

  const [showFinishQuote, setShowFinishQuote] = useState<boolean>(false)

  const b2bQuoteDraftList = B3LStorage.get('b2bQuoteDraftList')

  useEffect(() => {
    if (b2bQuoteDraftList?.length) {
      setShowFinishQuote(true)
    } else setShowFinishQuote(false)
  }, [isOpen, b2bQuoteDraftList])

  const {
    href,
  } = window.location

  if (href.includes('/checkout')) return <></>
  return (
    <Snackbar
      sx={{
        zIndex: '110000',
        right: '20px',
        bottom: '20px',
        left: 'auto',
      }}
      anchorOrigin={{
        vertical: 'bottom', horizontal: 'right',
      }}
      open
      key="123"
    >

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          alignItems: 'flex-end',
        }}
      >

        {
          showFinishQuote && !isOpen && productQuoteEnabled && !href.includes('/cart') && (
          <Button
            sx={{
              backgroundColor: '#ED6C02',
              height: '42px',
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
            Finish quote
          </Button>
          )
        }

      </Box>

    </Snackbar>
  )
}
