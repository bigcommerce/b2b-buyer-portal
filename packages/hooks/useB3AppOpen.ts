import { useCallback, useLayoutEffect, useState } from 'react'
import globalB3 from '@b3/global-b3'

import useMutationObservable from './useMutationObservable'

export interface OpenPageState {
  isOpen: boolean
  openUrl?: string
  isPageComplete?: boolean
  handleEnterClick?: () => void
  params?: { [key: string]: string }
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

  const getCurrentLoginUrl = (href: string): string => {
    let url = '/login'
    if (typeof href !== 'string') return url
    if (href.includes('logout')) {
      url = '/login?loginFlag=3'
    }
    if (href?.includes('create_account')) {
      url = '/registered'
    }

    return url
  }

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
            initOpenState.handleEnterClick()
          } else {
            const href = (e.target as HTMLAnchorElement)?.href || ''
            const gotoUrl = registerArr.includes(e.target)
              ? getCurrentLoginUrl(href)
              : '/orders'
            setOpenPage({
              isOpen: true,
              openUrl: gotoUrl,
            })
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
