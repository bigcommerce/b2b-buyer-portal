import { useEffect } from 'react'

import { B3SStorage } from '@/utils'

interface UseMonitorBrowserBackProps {
  isOpen: boolean
  role: number | string
}

const useMonitorBrowserBack = ({
  isOpen,
  role,
}: UseMonitorBrowserBackProps) => {
  const history = window.location
  const isLogin = role !== 100

  useEffect(() => {
    const isEnterB2BBuyerPortal = B3SStorage.get('isEnterB2BBuyerPortal')

    if (isOpen && !history.hash.includes('/pdp')) {
      B3SStorage.set('isEnterB2BBuyerPortal', true)
    }

    if (!isOpen && isLogin && isEnterB2BBuyerPortal) {
      window.location.reload()
      B3SStorage.set('isEnterB2BBuyerPortal', false)
    }
    // disabling to avoid unnecessary renders when adding the missing dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history.href])
}

export default useMonitorBrowserBack
