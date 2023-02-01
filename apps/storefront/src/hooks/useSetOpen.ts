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

const useSetOpen = (isOpen: boolean, openUrl?: string) => {
  const {
    dispatch,
  } = useContext(GlobaledContext)
  useEffect(() => {
    if (isOpen) {
      // The iframe screen is removed
      document.body.style.height = '100%'
      document.body.style.overflow = 'hidden'
      // The iframe button opens and assigns the url
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

      // close all tips
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
  useSetOpen,
}
