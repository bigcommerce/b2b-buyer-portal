import {
  useContext,
  Dispatch,
  SetStateAction,
} from 'react'

import {
  Box,
  Button,
  Snackbar,
} from '@mui/material'

import GroupIcon from '@mui/icons-material/Group'

import type {
  OpenPageState,
} from '@b3/hooks'
import {
  B3SStorage,
} from '@/utils'
import {
  useMobile,
} from '@/hooks'

import {
  GlobaledContext,
} from '@/shared/global'

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

  const {
    state: {
      isAgenting,
    },
  } = useContext(GlobaledContext)

  const [isMobile] = useMobile()

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
          !isOpen && productQuoteEnabled && (
          <Button
            sx={{
              backgroundColor: '#ED6C02',
              height: '42px',
            }}
            onClick={() => {
              // B3SStorage.set('nextPath', '/')
              setOpenPage({
                isOpen: true,
                openUrl: '/quoteDraft',
              })
            }}
            variant="contained"
          >
            Finish quote
          </Button>
          )
        }

        {
          isAgenting && !isOpen && isMobile && (
          <Button
            sx={{
              backgroundColor: '#ED6C02',
              height: '42px',
              marginTop: '10px',
            }}
            onClick={() => {
              setOpenPage({
                isOpen: true,
                openUrl: '/',
              })
            }}
            variant="contained"
            startIcon={<GroupIcon />}
          >
            Mitsubishi
          </Button>
          )
        }

      </Box>

    </Snackbar>
  )
}
