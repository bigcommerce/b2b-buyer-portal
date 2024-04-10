import { ReactElement } from 'react'
import { v1 as uuid } from 'uuid'

import {
  AlertTip,
  MsgsProps,
} from '@/shared/dynamicallyVariable/context/config'

interface SnackbarItemProps {
  duration?: number
  jsx?: () => ReactElement
  isClose?: boolean
}

// interface SnackbarMessageProps extends SnackbarItemProps {
//   message: string
// }

interface SnackbarProps {
  [key: string]: (message: string, options?: SnackbarItemProps) => void
}

const snackbar: SnackbarProps = {}
const globalSnackbar: SnackbarProps = {}

const variants: AlertTip[] = ['error', 'success', 'info', 'warning']

variants.forEach((variant) => {
  snackbar[variant] = (message, options) => {
    const msgs: Array<MsgsProps> = [
      {
        isClose: options?.isClose || false,
        id: uuid(),
        type: variant,
        msg: message || `${variant} without any info.`,
        jsx: options?.jsx,
        time: 5000,
      },
    ]

    window.tipDispatch?.({
      type: 'tip',
      payload: {
        tipMessage: {
          autoHideDuration: options?.duration || 5000,
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
        time: 5000,
      },
    ]

    window.globalTipDispatch({
      type: 'globalTip',
      payload: {
        globalTipMessage: {
          autoHideDuration: options?.duration || 5000,
          msgs,
        },
      },
    })
  }
})

export { globalSnackbar, snackbar }
