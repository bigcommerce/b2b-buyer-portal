import {
  useContext,
  useEffect,
} from 'react'

import {
  GlobaledContext,
} from '@/shared/global'

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
  } = useContext(GlobaledContext)

  const [isMobile] = useMobile()

  useEffect(() => {
    window.tipDispatch = dispatch
  }, [])

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
    autoHideDuration = 13000,
    vertical = `${isMobile ? 'bottom' : 'bottom'}`,
    horizontal = 'right',
    isClose = false,
  } = tipMessage

  return (
    <>
      <B3Tip
        msgs={msgs}
        handleAllClose={setMsgs}
        autoHideDuration={autoHideDuration}
        handleItemClose={isClose ? handleClose : undefined}
        vertical={vertical}
        horizontal={horizontal}
      />
    </>
  )
}

export default B3LayoutTip
