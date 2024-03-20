import { lazy, useContext, useEffect } from 'react'
import { flushSync } from 'react-dom'

import { DynamicallyVariableedContext } from '@/shared/dynamicallyVariable'
import { MsgsProps } from '@/shared/dynamicallyVariable/context/config'

const B3Tip = lazy(() => import('./B3Tip'))

export default function B3GlobalTip() {
  const {
    state: { globalTipMessage },
    dispatch,
  } = useContext(DynamicallyVariableedContext)

  useEffect(() => {
    window.globalTipDispatch = dispatch
    // disabling cause it is not necessary to run this effect on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setMsgs = (msgs: [] | Array<MsgsProps> = []) => {
    dispatch({
      type: 'common',
      payload: {
        globalTipMessage: {
          ...globalTipMessage,
          msgs,
        },
      },
    })
  }

  const handleClose = (id: number | string) => {
    const msgs = globalTipMessage?.msgs || []
    const newMsgs = msgs.filter((msg) => msg.id !== id)
    setMsgs(newMsgs)
  }

  const closeMsgs = (id: number | string, reason: string) => {
    const { msgs = [] } = globalTipMessage

    if (reason === 'clickaway') return

    flushSync(() => {
      if (msgs.length) {
        const newMsgs = msgs.filter((item: MsgsProps) => item.id !== id)
        dispatch({
          type: 'common',
          payload: {
            globalTipMessage: {
              ...globalTipMessage,
              msgs: newMsgs,
            },
          },
        })
      }
    })
  }

  return (
    <B3Tip
      autoHideDuration={globalTipMessage?.autoHideDuration}
      msgs={globalTipMessage?.msgs}
      handleAllClose={closeMsgs}
      handleItemClose={handleClose}
      vertical="top"
      horizontal="right"
    />
  )
}
