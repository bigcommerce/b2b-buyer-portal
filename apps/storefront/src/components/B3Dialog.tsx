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

  return (
    <Box
      sx={{
        ml: 3,
        cursor: 'pointer',
      }}
    >
      <Box
        ref={container}
      />

      <Dialog
        open={isOpen}
        container={container.current}
        onClose={handleCloseClick}
        fullScreen={isMobile}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        {
          title && (
          <DialogTitle id="alert-dialog-title">
            {title}
          </DialogTitle>
          )
        }

        <DialogContent>
          {children}
        </DialogContent>
        <DialogActions>
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

                <Button
                  sx={{
                    ...rightStyleBtn,
                  }}
                  onClick={handleSaveClick}
                  autoFocus
                >
                  <B3Sping
                    isSpinning={loading}
                    tip=""
                    size={16}
                  >
                    {rightSizeBtn || 'save'}
                  </B3Sping>
                </Button>
              </>
            )
          }
        </DialogActions>
      </Dialog>
    </Box>

  )
}
