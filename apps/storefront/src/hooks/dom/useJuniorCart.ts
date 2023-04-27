import { useCallback } from 'react'
import { useMutationObservable } from '@b3/hooks'

import { removeCartPermissions } from '@/utils/b3RolePermissions'

interface MutationObserverProps {
  role: number | string
}

const useJuniorCart = ({ role }: MutationObserverProps) => {
  const cd = useCallback(() => {
    removeCartPermissions(role)
  }, [role])
  useMutationObservable(document.documentElement, cd)
}

export default useJuniorCart
