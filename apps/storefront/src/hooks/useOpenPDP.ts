import {
  useCallback, useState,
  SetStateAction,
  Dispatch,
  useEffect,
} from 'react'

import {
  useB3PDPOpen,
  useMutationObservable,
} from '@b3/hooks'

import globalB3 from '@b3/global-b3'

import type {
  OpenPageState,
} from '@b3/hooks'

interface MutationObserverProps {
  setOpenPage: Dispatch<SetStateAction<OpenPageState>>,
  isB2BUser: boolean,
  shoppingListEnabled: boolean,
}

const useOpenPDP = ({
  setOpenPage, isB2BUser, shoppingListEnabled,
}: MutationObserverProps) => {
  const [openQuickView, setOpenQuickView] = useState<boolean>(false)

  const changeQuickview = () => {
    setOpenQuickView((openQuickView) => !openQuickView)
  }

  useEffect(() => {
    const quickview = document.querySelectorAll('.quickview')
    quickview.forEach((dom: any) => {
      dom.addEventListener('click', () => changeQuickview())
    })

    return () => {
      quickview.forEach((dom: any) => {
        dom.removeEventListener('click', () => changeQuickview())
      })
    }
  }, [])

  const pdpCallBbck = useCallback(() => {
    setOpenPage({
      isOpen: true,
      openUrl: '/pdp',
    })
  }, [])

  const cd = useCallback(() => {
    if (document.querySelectorAll(globalB3['dom.setToShoppingListParentEl']).length) {
      setOpenQuickView((openQuickView) => !openQuickView)
    }
  }, [])

  useMutationObservable(document.documentElement, cd)

  useB3PDPOpen(globalB3['dom.setToShoppingListParentEl'], pdpCallBbck, isB2BUser, shoppingListEnabled, openQuickView)
}

export {
  useOpenPDP,
}
