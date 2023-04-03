import {
  useCallback,
  useState,
  useEffect,
} from 'react'

import {
  useMutationObservable,
} from '@b3/hooks'

const useDomVariation = (dom: string, quoteCallBbck?: () => void) => {
  const [openQuickView, setOpenQuickView] = useState<boolean>(true)

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

  const cd = useCallback(() => {
    if (quoteCallBbck) quoteCallBbck()
    if (document.querySelectorAll(dom).length) {
      setOpenQuickView((openQuickView) => !openQuickView)
    }
  }, [])

  useMutationObservable(document.documentElement, cd)

  return [openQuickView]
}

export {
  useDomVariation,
}
