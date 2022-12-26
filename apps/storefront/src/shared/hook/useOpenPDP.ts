import {
  useCallback, useState,
  SetStateAction,
  Dispatch,
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
  role: string | number,
}

const useOpenPDP = ({
  setOpenPage, isB2BUser, role,
}: MutationObserverProps) => {
  const [openQuickViewNum, setOpenQuickViewNum] = useState<number>(0)

  const pdpCallBbck = useCallback(() => {
    setOpenPage({
      isOpen: true,
      openUrl: '/pdp',
    })
  }, [])

  const cd = useCallback(() => {
    if (document.querySelectorAll(globalB3['dom.setToShoppingList']).length) {
      setOpenQuickViewNum(openQuickViewNum + 1)
    }
  }, [])

  useMutationObservable(document.documentElement, cd)

  useB3PDPOpen(globalB3['dom.setToShoppingList'], pdpCallBbck, isB2BUser, role, openQuickViewNum)
}

export {
  useOpenPDP,
}
