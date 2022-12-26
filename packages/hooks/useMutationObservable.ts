import {
  useEffect,
} from 'react'

const DEFAULT_OPTIONS = {
  config: {
    childList: true, subtree: true,
  },
}

export const useMutationObservable = (parentEl: string | Element, cb: () => void, options = DEFAULT_OPTIONS) => {
  const element = typeof parentEl === 'string' ? document.querySelector(parentEl) : parentEl
  useEffect(() => {
    if (element) {
      const observer = new MutationObserver(cb)
      const {
        config,
      } = options
      observer.observe(element, config)
      return () => observer.disconnect()
    }
  }, [cb, options])
}
