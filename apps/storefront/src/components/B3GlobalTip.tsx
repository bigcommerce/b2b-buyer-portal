import {
  useContext,
  useEffect,
} from 'react'

import {
  MsgsProps,
} from '@/shared/global/context/config'

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

  return (
    <>
      <B3Tip
        msgs={globalTipMessage?.msgs}
        handleAllClose={() => setMsgs([])}
        handleItemClose={handleClose}
        vertical="top"
        horizontal="right"
      />
    </>
  )
}
