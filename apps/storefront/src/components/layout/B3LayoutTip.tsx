import {
  useContext,
  useEffect,
} from 'react'

import {
  DynamicallyVariableedContext,
} from '@/shared/dynamicallyVariable'

import {
  B3Tip,
} from '@/components'

import {
  useMobile,
} from '@/hooks'

import {
  MsgsProps,
} from '@/shared/global/context/config'

const B3LayoutTip = () => {
  const {
    state: {
      tipMessage,
    },
    dispatch,
  } = useContext(DynamicallyVariableedContext)

  const [isMobile] = useMobile()

  useEffect(() => {
    window.tipDispatch = dispatch
  }, [])

  // useEffect(() => {
  //   window.b3Tipmessage = tipMessage?.msgs || []
  // }, [tipMessage])

  const setMsgs = (msgs: [] | Array<MsgsProps> = []) => {
    dispatch({
      type: 'common',
      payload: {
        tipMessage: {
          ...tipMessage,
          msgs,
        },
      },
    })
  }

  const handleClose = (id: number | string) => {
    const msgs = tipMessage?.msgs || []
    const newMsgs = msgs.filter((msg) => msg.id !== id)
    setMsgs(newMsgs)
  }

  const {
    msgs = [],
    autoHideDuration = 3000,
    vertical = `${isMobile ? 'top' : 'top'}`,
    horizontal = 'right',
  } = tipMessage

  return (
    <>
      <B3Tip
        msgs={msgs}
        handleAllClose={() => setMsgs([])}
        autoHideDuration={autoHideDuration}
        handleItemClose={handleClose}
        // handleItemClose={isClose ? handleClose : undefined}
        vertical={vertical}
        horizontal={horizontal}
      />
    </>
  )
}

export default B3LayoutTip
