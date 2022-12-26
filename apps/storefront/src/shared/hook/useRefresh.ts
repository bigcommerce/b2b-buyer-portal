import {
  useEffect,
  useContext,
} from 'react'

import {
  GlobaledContext,
} from '@/shared/global'

const {
  height: defaultHeight,
  overflow: defaultOverflow,
} = document.body.style

const useRefresh = (isOpen: boolean, openUrl?: string) => {
  const {
    dispatch,
  } = useContext(GlobaledContext)
  useEffect(() => {
    if (isOpen) {
      document.body.style.height = '100%'
      document.body.style.overflow = 'hidden'
      if (openUrl) {
        const {
          origin,
          pathname,
          search,
        } = window.location
        window.location.href = `${origin}${pathname}${search}#${openUrl}`
      }
    } else {
      document.body.style.height = defaultHeight
      document.body.style.overflow = defaultOverflow
      dispatch({
        type: 'common',
        payload: {
          tipMessage: {
            msgs: [],
          },
        },
      })
    }
  }, [isOpen])
}

export {
  useRefresh,
}
