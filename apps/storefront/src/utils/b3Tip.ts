import {
  v1 as uuid,
} from 'uuid'

interface SnackbarProps {
  [key: string]: (message: string, duration?: number) => void
}

const snackbar: SnackbarProps = {}
const variants = ['error', 'success', 'info', 'warning']

variants.forEach((variant) => {
  snackbar[variant] = (message = `${variant} without any info.`, duration = 3000) => {
    window.tipDispatch({
      type: 'common',
      payload: {
        tipMessage: {
          autoHideDuration: duration,
          isClose: false,
          msgs: [
            {
              id: uuid(),
              type: variant,
              msg: message,
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
