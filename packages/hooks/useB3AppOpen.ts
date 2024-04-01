import { useCallback, useLayoutEffect, useState } from 'react'
import globalB3 from '@b3/global-b3'

import useMutationObservable from './useMutationObservable'

// interface GotoPageByClickProps {
//   href: string
//   isRegisterArrInclude: boolean
// }
interface ChildNodeListProps extends ChildNode {
  href?: string
  localName?: string
}

export interface OpenPageState {
  isOpen: boolean
  openUrl?: string
  isPageComplete?: boolean
  handleEnterClick?: (href: string, bool: boolean, timeTarget: number) => void
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

  const handleJudgeSearchNode = (element: MouseEvent) => {
    let isSearchNode = false
    const target = element.target as HTMLAnchorElement
    const searchNodeKey = ['alt', 'title', 'name']

    searchNodeKey.forEach((key) => {
      if (
        target.getAttribute(key) &&
        target.getAttribute(key)?.includes('search')
      ) {
        isSearchNode = true
      }
    })

    if (
      !isSearchNode &&
      typeof target.className === 'string' &&
      target.className?.includes('search')
    ) {
      const parentNode = target?.parentNode as HTMLAnchorElement
      const childNodeList = target?.childNodes

      if (
        parentNode &&
        (parentNode?.title === 'search' || parentNode?.name === 'search')
      ) {
        isSearchNode = true
      }

      if (childNodeList && childNodeList.length > 0) {
        childNodeList.forEach((childNode) => {
          const child = childNode as HTMLAnchorElement
          if (
            child &&
            (child?.title === 'search' || child?.name === 'search')
          ) {
            isSearchNode = true
          }
        })
      }
    }

    return isSearchNode
  }

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
          const isSearchNode = handleJudgeSearchNode(e)
          if (isSearchNode) return false
          e.preventDefault()
          e.stopPropagation()
          const isRegisterArrInclude = registerArr.includes(e.target)
          const tagHref = (e.target as HTMLAnchorElement)?.href
          let href = tagHref || '/orders'
          const timeTarget = Date.now()
          if (!tagHref || typeof timeTarget !== 'string') {
            let parentNode = (e.target as HTMLAnchorElement)?.parentNode
            let parentHref = (parentNode as HTMLAnchorElement)?.href
            let number = 0
            while (number < 3 && !parentHref) {
              parentNode = (parentNode as HTMLAnchorElement)?.parentNode
              const newUrl = (parentNode as HTMLAnchorElement)?.href
              if (newUrl && typeof newUrl === 'string') {
                parentHref = newUrl
                number += 3
              } else {
                number += 1
              }
            }
            if (parentHref) {
              href = parentHref || '/orders'
            } else {
              const childNodeList = (e.target as HTMLAnchorElement)?.childNodes
              if (childNodeList.length > 0) {
                childNodeList.forEach((node: ChildNodeListProps) => {
                  const nodeHref = node?.href
                  if (nodeHref && node.localName === 'a') {
                    href = nodeHref || '/orders'
                  }
                })
              }
            }
          }

          const RoleInfo = sessionStorage.getItem('sf-B3Role')
          const B3Role = RoleInfo ? JSON.parse(RoleInfo || '') : ''
          const isLogin = B3Role === '' ? false : JSON.parse(B3Role) !== 100
          const hrefArr = href.split('/#')
          if (hrefArr[1] === '') {
            href = isLogin ? '/orders' : '/login'
          }

          if (
            window?.location?.pathname === '/checkout' &&
            (e.target as HTMLAnchorElement)?.getAttribute('href') === '#'
          ) {
            href = '/register'
          }

          if (
            isLogin &&
            href.includes('/login') &&
            !href.includes('action=create_account') &&
            !href.includes('action=logout')
          ) {
            href = +B3Role === 2 ? '/shoppingLists' : '/orders'
          }

          if (initOpenState?.handleEnterClick) {
            initOpenState.handleEnterClick(
              href,
              isRegisterArrInclude,
              timeTarget
            )
          }
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
    return () => {}
  }, [checkoutRegisterNumber, initOpenState?.isPageComplete])

  useMutationObservable(globalB3['dom.checkoutRegisterParentElement'], callback)

  return [openPage, setOpenPage] as const
}
