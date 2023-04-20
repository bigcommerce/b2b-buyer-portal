import {
  useContext,
  useEffect,
  useRef,
} from 'react'

import {
  MsgsProps,
} from '@/shared/dynamicallyVariable/context/config'

import {
  B3Tip,
} from './B3Tip'

import {
  DynamicallyVariableedContext,
} from '@/shared/dynamicallyVariable'

export const B3GlobalTip = () => {
  const {
    state: {
      globalTipMessage,
    },
    dispatch,
  } = useContext(DynamicallyVariableedContext)

  useEffect(() => {
    window.globalTipDispatch = dispatch
  }, [])

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  const closeMsgs = () => {
    const {
      msgs = [],
    } = globalTipMessage

    if (timer.current) {
      clearTimeout(timer.current)
    }

    if (msgs.length) {
      timer.current = setTimeout(() => {
        const newMsgs = msgs.filter((item: MsgsProps) => item.isClose)
        dispatch({
          type: 'common',
          payload: {
            tipMessage: {
              ...globalTipMessage,
              msgs: newMsgs,
            },
          },
        })
      }, globalTipMessage?.autoHideDuration)
    }
  }

  return (
    <>
      <B3Tip
        autoHideDuration={globalTipMessage?.autoHideDuration}
        msgs={globalTipMessage?.msgs}
        handleAllClose={() => closeMsgs()}
        handleItemClose={handleClose}
        vertical="top"
        horizontal="right"
      />
    </>
  )
}
