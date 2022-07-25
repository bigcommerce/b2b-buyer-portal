import {
  useState,
  useLayoutEffect,
  useCallback,
} from 'react'
import globalB3 from '@b3/global-b3'

import {
  useMutationObservable,
} from './useMutationObservable'

export const useB3AppOpen = (initOpenState: boolean) => {
  const [checkoutRegisterNumber, setCheckoutRegisterNumber] = useState<number>(0)

  const callback = useCallback(() => {
    setCheckoutRegisterNumber(() => checkoutRegisterNumber + 1)
  }, [checkoutRegisterNumber])

  const [isOpen, setIsOpen] = useState(initOpenState)
  useLayoutEffect(() => {
    if (document.querySelectorAll(globalB3['dom.registerElement']).length) {
      const registerArr = Array.from(document.querySelectorAll(globalB3['dom.registerElement']))
      const handleTriggerClick = (e: MouseEvent) => {
        if (registerArr.includes(e.target)) {
          e.preventDefault()
          e.stopPropagation()
          setIsOpen(!isOpen)
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

  return [isOpen, setIsOpen] as const
}
