import {
  ReactElement,
} from 'react'
import {
  v1 as uuid,
} from 'uuid'

interface SnackbarItemProps {
  duration?: number,
  jsx?: () => ReactElement,
  isClose?: boolean,
}

interface SnackbarProps {
  [key: string]: (message: string, options?: SnackbarItemProps) => void
}

const snackbar: SnackbarProps = {}
const variants = ['error', 'success', 'info', 'warning']

variants.forEach((variant) => {
  snackbar[variant] = (message, options) => {
    window.tipDispatch({
      type: 'common',
      payload: {
        tipMessage: {
          autoHideDuration: options?.duration || 3000,
          isClose: options?.isClose || false,
          msgs: [
            {
              id: uuid(),
              type: variant,
              msg: message || `${variant} without any info.`,
              jsx: options?.jsx,
            },
          ],
        },
      },
    })
  }
})

export {
  snackbar,
}
