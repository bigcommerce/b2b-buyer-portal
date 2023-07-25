import { useCallback, useLayoutEffect, useState } from 'react'
import globalB3 from '@b3/global-b3'

import useMutationObservable from './useMutationObservable'

// interface GotoPageByClickProps {
//   href: string
//   isRegisterArrInclude: boolean
// }
export interface OpenPageState {
  isOpen: boolean
  openUrl?: string
  isPageComplete?: boolean
  handleEnterClick?: (href: string, bool: boolean) => void
  params?: { [key: string]: string }
  // gotoPageByClick: ({
  //   href,
  //   isRegisterArrInclude,
  // }: GotoPageByClickProps) => string
}

export const useB3AppOpen = (initOpenState: OpenPageState) => {
  const [checkoutRegisterNumber, setCheckoutRegisterNumber] =
    useState<number>(0)

  const callback = useCallback(() => {
    setCheckoutRegisterNumber(() => checkoutRegisterNumber + 1)
  }, [checkoutRegisterNumber])

  const [openPage, setOpenPage] = useState<OpenPageState>({
    isOpen: initOpenState.isOpen,
    openUrl: '',
    params: {},
  })

  useLayoutEffect(() => {
    const registerArr = Array.from(
      document.querySelectorAll(globalB3['dom.registerElement'])
    )
    const allOtherArr = Array.from(
      document.querySelectorAll(globalB3['dom.allOtherElement'])
    )

    if (registerArr.length || allOtherArr.length) {
      const handleTriggerClick = (e: MouseEvent) => {
        if (registerArr.includes(e.target) || allOtherArr.includes(e.target)) {
          e.preventDefault()
          e.stopPropagation()
          const isRegisterArrInclude = registerArr.includes(e.target)

          const href =
            (e.target as HTMLAnchorElement)?.getAttribute('href') || ''
          if (initOpenState?.handleEnterClick) {
            initOpenState.handleEnterClick(href, isRegisterArrInclude)
          }
        }
        return false
      }
      window.b2bStorefrontApp.isInit = true

      window.addEventListener('click', handleTriggerClick, {
        capture: true,
      })
      return () => {
        window.removeEventListener('click', handleTriggerClick)
      }
    }
    return () => {}
  }, [checkoutRegisterNumber, initOpenState?.isPageComplete])

  useMutationObservable(globalB3['dom.checkoutRegisterParentElement'], callback)

  return [openPage, setOpenPage] as const
}
