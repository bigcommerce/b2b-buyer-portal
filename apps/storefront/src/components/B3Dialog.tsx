import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material'

import {
  useRef,
  ReactElement,
  ReactNode,
} from 'react'

import {
  useMobile,
  useScrollBar,
} from '@/hooks'

import {
  B3Sping,
} from './spin/B3Sping'

interface B3DialogProps<T> {
  customActions?: () => ReactElement
  isOpen: boolean,
  leftStyleBtn?: {[key: string]: string}
  rightStyleBtn?: {[key: string]: string}
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
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false
  fullWidth?: boolean
  disabledSaveBtn?: boolean,
}

export const B3Dialog:<T> ({
  customActions,
  isOpen,
  leftStyleBtn,
  rightStyleBtn,
  title,
  handleLeftClick,
  handRightClick,
  children,
  loading,
  row,
  isShowBordered,
  showRightBtn,
  maxWidth,
  fullWidth,
  disabledSaveBtn,
}: B3DialogProps<T>) => ReactElement = ({
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
  maxWidth = 'sm',
  fullWidth = false,
  disabledSaveBtn = false,
}) => {
  const container = useRef<HTMLInputElement | null>(null)

  const [isMobile] = useMobile()

  const handleSaveClick = () => {
    if (handRightClick) {
      if (row) handRightClick(row)
      if (!row) handRightClick()
    }
  }

  const handleCloseClick = () => {
    if (handleLeftClick) handleLeftClick()
  }

  useScrollBar(isOpen)

  return (
    <Box>
      <Box
        ref={container}
      />

      <Dialog
        fullWidth={fullWidth}
        open={isOpen}
        container={container.current}
        onClose={handleCloseClick}
        fullScreen={isMobile}
        maxWidth={maxWidth}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        {
          title && (
          <DialogTitle
            sx={
              isShowBordered ? {
                borderBottom: '1px solid #D9DCE9',
                mb: 2,
              } : {}
            }
            id="alert-dialog-title"
          >
            {title}
          </DialogTitle>
          )
        }
        <DialogContent>
          {children}
        </DialogContent>
        <DialogActions
          sx={
            isShowBordered ? {
              borderTop: '1px solid #D9DCE9',
            } : {}
          }
        >
          {
            customActions ? customActions() : (
              <>
                <Button
                  sx={{
                    ...leftStyleBtn,
                  }}
                  onClick={handleCloseClick}
                >
                  {leftSizeBtn || 'cancel'}

                </Button>

                {
                  showRightBtn && (
                    <Button
                      sx={{
                        ...rightStyleBtn,
                      }}
                      onClick={handleSaveClick}
                      autoFocus
                      disabled={disabledSaveBtn || loading}
                    >
                      <B3Sping
                        isSpinning={loading}
                        tip=""
                        size={16}
                      >
                        {rightSizeBtn || 'save'}
                      </B3Sping>
                    </Button>
                  )
                }
              </>
            )
          }
        </DialogActions>
      </Dialog>
    </Box>

  )
}
