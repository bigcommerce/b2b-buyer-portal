import { useCallback, useLayoutEffect, useState } from 'react'
import globalB3 from '@b3/global-b3'

import useMutationObservable from './useMutationObservable'

interface GotoPageByClickProps {
  href: string
  isRegisterArrInclude: boolean
}
export interface OpenPageState {
  isOpen: boolean
  openUrl?: string
  isPageComplete?: boolean
  handleEnterClick?: (href: string) => void
  params?: { [key: string]: string }
  gotoPageByClick?: ({
    href,
    isRegisterArrInclude,
  }: GotoPageByClickProps) => string
}

export const useB3AppOpen = (initOpenState: OpenPageState) => {
  const [checkoutRegisterNumber, setCheckoutRegisterNumber] =
    useState<number>(0)

  const callback = useCallback(() => {
    setCheckoutRegisterNumber(() => checkoutRegisterNumber + 1)
  }, [checkoutRegisterNumber])

  // const {
  //   dispatch,
  // } = useContext(GlobaledContext)

  const [openPage, setOpenPage] = useState<OpenPageState>({
    isOpen: initOpenState.isOpen,
    openUrl: '',
    params: {},
  })

  useLayoutEffect(() => {
    // if (globalB3['dom.openB3Checkout'] && document.getElementById(globalB3['dom.openB3Checkout'])) {
    //   setOpenPage({
    //     isOpen: true,
    //     openUrl: '/login',
    //   })
    // }
    // login register  orther

    if (document.querySelectorAll(globalB3['dom.registerElement']).length) {
      const registerArr = Array.from(
        document.querySelectorAll(globalB3['dom.registerElement'])
      )
      const allOtherArr = Array.from(
        document.querySelectorAll(globalB3['dom.allOtherElement'])
      )
      const handleTriggerClick = (e: MouseEvent) => {
        if (registerArr.includes(e.target) || allOtherArr.includes(e.target)) {
          e.preventDefault()
          e.stopPropagation()
          if (
            !initOpenState?.isPageComplete &&
            allOtherArr.includes(e.target) &&
            initOpenState?.handleEnterClick
          ) {
            const href = (e.target as HTMLAnchorElement)?.href || ''
            initOpenState.handleEnterClick(href)
          } else {
            const href = (e.target as HTMLAnchorElement)?.href || ''
            const isRegisterArrInclude = registerArr.includes(e.target)
            if (initOpenState?.gotoPageByClick) {
              const gotoUrl = initOpenState.gotoPageByClick({
                href,
                isRegisterArrInclude,
              })

              setOpenPage({
                isOpen: true,
                openUrl: gotoUrl,
              })
            } else {
              setOpenPage({
                isOpen: true,
                openUrl: '/orders',
              })
            }
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
