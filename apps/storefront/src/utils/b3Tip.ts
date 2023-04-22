import { ReactElement } from 'react'
import { v1 as uuid } from 'uuid'

interface SnackbarItemProps {
  duration?: number
  jsx?: () => ReactElement
  isClose?: boolean
}

interface SnackbarMessageProps extends SnackbarItemProps {
  message: string
}

interface SnackbarProps {
  [key: string]: (
    message: string | SnackbarMessageProps[],
    options?: SnackbarItemProps
  ) => void
}

const snackbar: SnackbarProps = {}
const globalSnackbar: SnackbarProps = {}

const variants = ['error', 'success', 'info', 'warning']

variants.forEach((variant) => {
  snackbar[variant] = (message, options) => {
    const msgs = [
      {
        isClose: options?.isClose || false,
        id: uuid(),
        type: variant,
        msg: message || `${variant} without any info.`,
        jsx: options?.jsx,
      },
    ]

    window.tipDispatch({
      type: 'tip',
      payload: {
        tipMessage: {
          autoHideDuration: options?.duration || 3000,
          msgs,
        },
      },
    })
  }

  globalSnackbar[variant] = (message, options) => {
    const msgs = [
      {
        isClose: options?.isClose || false,
        id: uuid(),
        type: variant,
        msg: message || `${variant} without any info.`,
        jsx: options?.jsx,
      },
    ]

    window.globalTipDispatch({
      type: 'globalTip',
      payload: {
        globalTipMessage: {
          autoHideDuration: options?.duration || 3000,
          msgs,
        },
      },
    })
  }
})

export { globalSnackbar, snackbar }
