import {
  useContext,
} from 'react'

import {
  GlobaledContext,
} from '@/shared/global'

import {
  DispatchProps,
} from '@/shared/global/context/config'

import Loading from './Loading'

export const B3PageMask = () => {
  const {
    state: {
      showPageMask,
    },
  } = useContext(GlobaledContext)

  return (
    <>
      {
        showPageMask && (
          <Loading />
        )
      }
    </>
  )
}

export const showPageMask = (dispatch: DispatchProps, isShow: boolean) => {
  dispatch({
    type: 'common',
    payload: {
      showPageMask: isShow,
    },
  })
}
