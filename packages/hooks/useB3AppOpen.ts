import {
  useState,
  useLayoutEffect,
  useCallback,
} from 'react'
import globalB3 from '@b3/global-b3'

import {
  useMutationObservable,
} from './useMutationObservable'

import {
  useB3PDPOpen,
} from './useB3PDPOpen'

export interface OpenPageState {
  isOpen: boolean,
  openUrl?: string,
}

export const useB3AppOpen = (initOpenState: OpenPageState) => {
  const [checkoutRegisterNumber, setCheckoutRegisterNumber] = useState<number>(0)

  const callback = useCallback(() => {
    setCheckoutRegisterNumber(() => checkoutRegisterNumber + 1)
  }, [checkoutRegisterNumber])

  const [openPage, setOpenPage] = useState<OpenPageState>({
    isOpen: initOpenState.isOpen,
    openUrl: '',
  })

  const pdpCallBbck = useCallback(() => {
    setOpenPage({
      isOpen: true,
      openUrl: '/pdp',
    })
  }, [])

  const getCurrentLoginUrl = (href: string): string => {
    let url = '/login'
    if (href.includes('logout')) {
      url = '/login?loginFlag=3'
    }
    if (href.includes('create_account')) {
      url = '/registered'
    }

    return url
  }

  useLayoutEffect(() => {
    if (globalB3['dom.openB3Checkout'] && document.getElementById(globalB3['dom.openB3Checkout'])) {
      setOpenPage({
        isOpen: true,
        openUrl: '/login',
      })
    }
    // login register  orther
    if (document.querySelectorAll(globalB3['dom.registerElement']).length) {
      const registerArr = Array.from(document.querySelectorAll(globalB3['dom.registerElement']))
      const allOtherArr = Array.from(document.querySelectorAll(globalB3['dom.allOtherElement']))

      const handleTriggerClick = (e: MouseEvent) => {
        if (registerArr.includes(e.target) || allOtherArr.includes(e.target)) {
          e.preventDefault()
          e.stopPropagation()

          const href = (e.target as any)?.href || ''
          const gotoUrl = registerArr.includes(e.target) ? getCurrentLoginUrl(href) : '/'

          setOpenPage({
            isOpen: true,
            openUrl: gotoUrl,
          })
        }
        return false
      }
      window.addEventListener('click', handleTriggerClick, {
        capture: true,
      })
      return () => {
        window.removeEventListener('click', handleTriggerClick)
      }
    }
  }, [checkoutRegisterNumber])

  useMutationObservable(globalB3['dom.checkoutRegisterParentElement'], callback)

  useB3PDPOpen(globalB3['dom.setToShoppingList'], pdpCallBbck)

  return [openPage, setOpenPage] as const
}
