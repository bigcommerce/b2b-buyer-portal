import { DispatchProps } from '@/shared/global/context/config'

const showPageMask = (dispatch: DispatchProps, isShow: boolean) => {
  const b2bStyleElement = document.getElementById('b2b-account-page-hide-body')
  if (b2bStyleElement) {
    b2bStyleElement.innerHTML = ''
  }

  dispatch({
    type: 'common',
    payload: {
      showPageMask: isShow,
    },
  })
}

export default showPageMask
