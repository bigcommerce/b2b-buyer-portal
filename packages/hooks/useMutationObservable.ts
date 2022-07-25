import {
  useEffect,
} from 'react'

const DEFAULT_OPTIONS = {
  config: {
    childList: true, subtree: true,
  },
}

export const useMutationObservable = (parentEl: string, cb: () => void, options = DEFAULT_OPTIONS) => {
  const element = document.querySelector(parentEl)
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
