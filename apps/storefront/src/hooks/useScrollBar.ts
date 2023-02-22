import {
  useEffect,
  useContext,
} from 'react'

import {
  ThemeFrameContext,
} from '@/components/ThemeFrame'

const useScrollBar = (open: boolean) => {
  const IframeDocument = useContext(ThemeFrameContext)

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
