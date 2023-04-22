import { useContext } from 'react'

import { GlobaledContext } from '@/shared/global'
import { DispatchProps } from '@/shared/global/context/config'

import Loading from './Loading'

export function B3PageMask() {
  const {
    state: { showPageMask },
  } = useContext(GlobaledContext)

  return showPageMask ? <Loading /> : null
}

export const showPageMask = (dispatch: DispatchProps, isShow: boolean) => {
  dispatch({
    type: 'common',
    payload: {
      showPageMask: isShow,
    },
  })
}
