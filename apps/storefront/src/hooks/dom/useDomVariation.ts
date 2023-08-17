import { useCallback, useEffect, useState } from 'react'
import { useMutationObservable } from '@b3/hooks'

const useDomVariation = (dom: string, quoteCallBbck?: () => void) => {
  const [openQuickView, setOpenQuickView] = useState<boolean>(true)

  const changeQuickview = () => {
    setOpenQuickView((openQuickView) => !openQuickView)
  }

  useEffect(() => {
    const quickview = document.querySelectorAll('.quickview')
    quickview.forEach((dom: CustomFieldItems) => {
      dom.addEventListener('click', () => changeQuickview())
    })

    return () => {
      quickview.forEach((dom: CustomFieldItems) => {
        dom.removeEventListener('click', () => changeQuickview())
      })
    }
  }, [])

  const cd = useCallback(() => {
    if (quoteCallBbck) quoteCallBbck()
    const doms = document.querySelectorAll(dom)
    if (doms.length) {
      doms.forEach((dom: CustomFieldItems) => {
        if (!dom?.ready) {
          dom.ready = true
          changeQuickview()
        }
      })
    }
  }, [])

  useMutationObservable(document.documentElement, cd)

  return [openQuickView]
}

export default useDomVariation
