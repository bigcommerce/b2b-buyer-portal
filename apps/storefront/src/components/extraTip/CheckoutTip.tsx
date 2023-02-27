import {
  useState,
  Dispatch,
  SetStateAction,
  useContext,
} from 'react'

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
} from '@mui/material'

import type {
  OpenPageState,
} from '@b3/hooks'
import {
  useMobile,
} from '@/hooks'

import {
  GlobaledContext,
} from '@/shared/global'

interface CheckoutTipProps {
  setOpenPage: Dispatch<SetStateAction<OpenPageState>>,
}

const CheckoutTip = (props: CheckoutTipProps) => {
  const {
    setOpenPage,
  } = props
  const [open, setOpen] = useState<boolean>(true)

  const [isMobile] = useMobile()

  const {
    state: {
      role,
      isAgenting,
    },
  } = useContext(GlobaledContext)

  const {
    href,
  } = window.location

  if (!href.includes('/checkout')) return <></>

  return (
    <>
      {
        role === 3 && !isAgenting && (
        <Dialog
          sx={{
            zIndex: 100000000000,
            padding: '40px 40px 20px 40px',
          }}
          open={open}
          onClose={() => setOpen(true)}
          fullScreen={isMobile}
        >
          <DialogContent>
            please select a company
          </DialogContent>
          <DialogActions
            sx={{
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <Button
              onClick={() => {
                setOpen(false)
                setOpenPage({
                  isOpen: true,
                  openUrl: '/',
                })
              }}
              variant="contained"
            >
              ok

            </Button>
          </DialogActions>
        </Dialog>
        )
      }
    </>
  )
}

export {
  CheckoutTip,
}
