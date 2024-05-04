import { useEffect } from 'react'

const DEFAULT_OPTIONS = {
  config: {
    childList: true,
    subtree: true,
  },
}

const useMutationObservable = (
  parentEl: string | Element,
  cb: () => void,
  options = DEFAULT_OPTIONS
) => {
  const element =
    typeof parentEl === 'string' ? document.querySelector(parentEl) : parentEl
  useEffect(() => {
    if (element) {
      const observer = new MutationObserver(cb)
      const { config } = options
      observer.observe(element, config)
      return () => observer.disconnect()
    }
    return undefined
  }, [cb, element, options])
}
export default useMutationObservable
