import { useEffect } from 'react'

import { themeFrameSelector, useAppSelector } from '@/store'

const useScrollBar = (open: boolean) => {
  const IframeDocument = useAppSelector(themeFrameSelector)

  useEffect(() => {
    if (IframeDocument) {
      IframeDocument.body.style.overflow = open ? 'hidden' : 'initial'
    }
  }, [open])
}

export default useScrollBar
