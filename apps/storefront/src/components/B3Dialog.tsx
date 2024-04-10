import { ReactElement, ReactNode, useRef } from 'react'
import { useB3Lang } from '@b3/lang'
import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material'

import useMobile from '@/hooks/useMobile'
import useScrollBar from '@/hooks/useScrollBar'
import { useAppSelector } from '@/store'

import CustomButton from './button/CustomButton'
import B3Sping from './spin/B3Sping'

interface B3DialogProps<T> {
  customActions?: () => ReactElement
  isOpen: boolean
  leftStyleBtn?: { [key: string]: string }
  rightStyleBtn?: { [key: string]: string }
  leftSizeBtn?: string
  rightSizeBtn?: string
  title?: string
  handleLeftClick?: () => void
  handRightClick?: (row?: T) => Promise<void> | void | undefined
  children: ReactNode
  loading?: boolean
  row?: T
  isShowBordered?: boolean
  showRightBtn?: boolean
  showLeftBtn?: boolean
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false
  fullWidth?: boolean
  disabledSaveBtn?: boolean
  dialogContentSx?: { [key: string]: string }
}

export default function B3Dialog<T>({
  customActions,
  isOpen,
  leftStyleBtn = {},
  rightStyleBtn = {},
  leftSizeBtn,
  rightSizeBtn,
  title,
  handleLeftClick,
  handRightClick,
  children,
  loading = false,
  row,
  isShowBordered = true,
  showRightBtn = true,
  showLeftBtn = true,
  maxWidth = 'sm',
  dialogContentSx = {},
  fullWidth = false,
  disabledSaveBtn = false,
}: B3DialogProps<T>) {
  const container = useRef<HTMLInputElement | null>(null)

  const [isMobile] = useMobile()

  const isAgenting = useAppSelector(
    ({ b2bFeatures }) => b2bFeatures.masqueradeCompany.isAgenting
  )

  const handleSaveClick = () => {
    if (handRightClick) {
      if (row) handRightClick(row)
      if (!row) handRightClick()
    }
  }

  const handleCloseClick = (reason?: string) => {
    if (reason === 'backdropClick') return
    if (handleLeftClick) handleLeftClick()
  }

  useScrollBar(isOpen)

  const b3Lang = useB3Lang()

  return (
    <Box>
      <Box ref={container} />

      <Dialog
        fullWidth={fullWidth}
        open={isOpen}
        container={container.current}
        onClose={(event: object, reason: string) => handleCloseClick(reason)}
        fullScreen={isMobile}
        maxWidth={maxWidth}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        {title && (
          <DialogTitle
            sx={
              isShowBordered
                ? {
                    borderBottom: '1px solid #D9DCE9',
                    mb: 2,
                  }
                : {}
            }
            id="alert-dialog-title"
          >
            {title}
          </DialogTitle>
        )}
        <DialogContent
          sx={{
            ...dialogContentSx,
          }}
        >
          {children}
        </DialogContent>
        <DialogActions
          sx={
            isShowBordered
              ? {
                  borderTop: '1px solid #D9DCE9',
                  marginBottom: isAgenting && isMobile ? '52px' : '0',
                }
              : {
                  marginBottom: isAgenting && isMobile ? '52px' : '0',
                }
          }
        >
          {customActions ? (
            customActions()
          ) : (
            <>
              {showLeftBtn && (
                <CustomButton
                  sx={{
                    ...leftStyleBtn,
                  }}
                  onClick={() => handleCloseClick('')}
                >
                  {leftSizeBtn || b3Lang('global.dialog.cancel')}
                </CustomButton>
              )}

              {showRightBtn && (
                <CustomButton
                  sx={{
                    ...rightStyleBtn,
                  }}
                  onClick={handleSaveClick}
                  autoFocus
                  disabled={disabledSaveBtn || loading}
                >
                  <B3Sping isSpinning={loading} tip="" size={16}>
                    {rightSizeBtn || b3Lang('global.dialog.save')}
                  </B3Sping>
                </CustomButton>
              )}
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  )
}
