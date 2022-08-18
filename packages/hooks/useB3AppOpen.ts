import {
  useState,
  useLayoutEffect,
  useCallback,
} from 'react'
import globalB3 from '@b3/global-b3'

import {
  useMutationObservable,
} from './useMutationObservable'

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
    if (document.querySelectorAll(globalB3['dom.registerElement']).length) {
      const registerArr = Array.from(document.querySelectorAll(globalB3['dom.registerElement']))
      const handleTriggerClick = (e: MouseEvent) => {
        if (registerArr.includes(e.target)) {
          e.preventDefault()
          e.stopPropagation()

          const href = (e.target as any)?.href || ''
          const gotoUrl = getCurrentLoginUrl(href)

          const {
            pathname,
          } = window.location

          window.sessionStorage.setItem('isCheckout', JSON.stringify(pathname === '/checkout'))

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

  return [openPage, setOpenPage] as const
}
