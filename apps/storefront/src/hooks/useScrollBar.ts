import {
  useEffect,
} from 'react'
import {
  useSelector,
} from 'react-redux'
import {
  themeFrameSelector,
} from '@/store'

const useScrollBar = (open: boolean) => {
  const IframeDocument = useSelector(themeFrameSelector)

  useEffect(() => {
    if (IframeDocument) {
      IframeDocument.body.style.overflow = open ? 'hidden' : 'initial'
      // IframeDocument.body.style.paddingRight = open ? '16px' : '0'
    }
  }, [open])
}

export {
  useScrollBar,
}
