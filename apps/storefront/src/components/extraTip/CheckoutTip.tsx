import { Dispatch, SetStateAction, useContext, useState } from 'react'
import type { OpenPageState } from '@b3/hooks'
import { Dialog, DialogActions, DialogContent } from '@mui/material'

import { useMobile } from '@/hooks'
import { GlobaledContext } from '@/shared/global'
import { useAppSelector } from '@/store'

import { CustomButton } from '..'

interface CheckoutTipProps {
  setOpenPage: Dispatch<SetStateAction<OpenPageState>>
}

function CheckoutTip(props: CheckoutTipProps) {
  const { setOpenPage } = props
  const [open, setOpen] = useState<boolean>(true)

  const [isMobile] = useMobile()

  const {
    state: { isAgenting },
  } = useContext(GlobaledContext)
  const role = useAppSelector(({ company }) => company.customer.role)

  const { href } = window.location

  if (!href.includes('/checkout')) return null

  return (
    role === 3 &&
    !isAgenting && (
      <Dialog
        sx={{
          zIndex: 99999999993,
          padding: '40px 40px 20px 40px',
        }}
        open={open}
        onClose={() => setOpen(true)}
        fullScreen={isMobile}
      >
        <DialogContent>please select a company</DialogContent>
        <DialogActions
          sx={{
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <CustomButton
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
          </CustomButton>
        </DialogActions>
      </Dialog>
    )
  )
}

export default CheckoutTip
