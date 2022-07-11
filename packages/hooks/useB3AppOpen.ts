import {
  useState, useLayoutEffect,
} from 'react'
import globalB3 from '@b3/global-b3'

export const useB3AppOpen = (initOpenState: boolean) => {
  const [isOpen, setIsOpen] = useState(initOpenState)
  useLayoutEffect(() => {
    const registerArr = Array.from(document.querySelectorAll(globalB3['dom.registerElement']))
    const handleTriggerClick = (e: MouseEvent) => {
      if (registerArr.includes(e.target)) {
        e.preventDefault()
        e.stopPropagation()
        setIsOpen(!isOpen)
      }
      return false
    }
    window.addEventListener('click', handleTriggerClick, { capture: true })
    return () => {
      window.removeEventListener('click', handleTriggerClick)
    }
  }, [])
  return [isOpen, setIsOpen] as const
}
