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
      const mainPage = IframeDocument.querySelector('#app-mainPage-layout') as HTMLElement
      mainPage.style.paddingRight = open ? '57px' : '40px'
      IframeDocument.body.style.overflow = open ? 'hidden' : 'initial'
    }
  }, [open])
}

export {
  useScrollBar,
}
