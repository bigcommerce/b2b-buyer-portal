import {
  ReactNode,
  useRef,
} from 'react'

import {
  Box,
  Dialog,
  DialogActions,
  DialogTitle,
  Divider,
  CircularProgress,
  IconButton,
  Button,
  Breakpoint,
} from '@mui/material'

import styled from '@emotion/styled'

import CloseIcon from '@mui/icons-material/Close'

import {
  useMobile,
} from '@/hooks'

const Spinner = styled(CircularProgress)({
  marginRight: 8,
})

interface StyleButtonProps {
  customconfirmcolor?: string,
  customconfirmhovercolor?: string,
}

const StyleButton = styled(Button)((props: StyleButtonProps) => ({
  backgroundColor: props.customconfirmcolor,

  '&:hover': {
    backgroundColor: props.customconfirmhovercolor,
  },
}))

const StyledDialogTitle = styled(DialogTitle)({
  '&.MuiTypography-root': {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',

    '& > p': {
      margin: 0,
      fontWeight: 'bold',
    },

    '& .MuiIconButton-root': {
      padding: '0 12px',
    },
  },
})

interface B3ConfirmDialogProps {
  isOpen: boolean,
  onClose?: () => void,
  onConfirm?: () => void,
  showTitle?: boolean,
  title?: ReactNode,
  children?: ReactNode,
  isCancelDisabled?: boolean,
  isConfirmDisabled?: boolean,
  isSpinning?: boolean,
  cancelText?: string,
  confirmText?: string
  fullScreen?: boolean,
  maxWidth?: Breakpoint | false,
  fullWidth?: boolean,
  isShowCancelBtn?: boolean,
  isHiddenDivider?: boolean,
  isShowAction?: boolean,
  isShowCloseIcon?: boolean,
  renderConfirm?: ReactNode | (() => ReactNode),
  cancelColor?: 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning',
  confirmColor?: 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning',
  customConfirmColor?: string,
  customConfirmHoverColor?: string,
}

export const B3ConfirmDialog = (props: B3ConfirmDialogProps) => {
  const [isMobile] = useMobile()
  const container = useRef<HTMLInputElement | null>(null)

  const {
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirm',
    showTitle = true,
    children,
    isCancelDisabled = false,
    isConfirmDisabled = true,
    isSpinning = false,
    cancelText = 'Cancel',
    confirmText = 'OK',
    fullScreen = isMobile,
    maxWidth = 'sm',
    fullWidth = true,
    isShowCancelBtn = true,
    isHiddenDivider = false,
    isShowAction = true,
    isShowCloseIcon = true,
    renderConfirm,
    cancelColor,
    confirmColor,
    customConfirmColor,
    customConfirmHoverColor,
  } = props

  return (
    <Box>
      <Box
        ref={container}
      />
      <Dialog
        container={container.current}
        open={isOpen}
        onClose={onClose}
        fullScreen={fullScreen}
        maxWidth={maxWidth}
        fullWidth={fullWidth}
      >
        {
          showTitle && (
          <>
            <StyledDialogTitle>
              <p>{title}</p>
              {isShowCloseIcon ? (
                <IconButton onClick={onClose}>
                  <CloseIcon />
                </IconButton>
              ) : null}
            </StyledDialogTitle>
            {!isHiddenDivider ? <Divider /> : <></>}
          </>
          )
        }
        {children}
        {!isHiddenDivider ? <Divider /> : <></>}
        {
          isShowAction ? (
            <DialogActions>
              {
                isShowCancelBtn ? (
                  <StyleButton
                    onClick={onClose}
                    color={cancelColor}
                    disabled={isCancelDisabled}
                  >
                    {cancelText}
                  </StyleButton>
                ) : null
              }
              {

                typeof renderConfirm === 'function' ? renderConfirm() : renderConfirm || (
                  (
                  <StyleButton
                    onClick={onConfirm}
                    color={confirmColor}
                    disabled={isConfirmDisabled}
                    customconfirmcolor={customConfirmColor}
                    customconfirmhovercolor={customConfirmHoverColor}
                  >
                    {
                      isSpinning && (
                        <Spinner
                          size={18}
                          thickness={2}
                        />
                      )
                    }
                    {confirmText}
                  </StyleButton>
                  )
                )
              }
            </DialogActions>
          ) : null
        }
      </Dialog>
    </Box>
  )
}
