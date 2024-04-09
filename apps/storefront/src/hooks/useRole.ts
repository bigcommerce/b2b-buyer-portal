import { useContext, useEffect, useState } from 'react'

import { GlobaledContext } from '@/shared/global'
import { useAppSelector } from '@/store'
import { CustomerRole } from '@/types'

const useRole = () => {
  const {
    state: { isB2BUser, isAgenting },
  } = useContext(GlobaledContext)
  const role = useAppSelector(({ company }) => company.customer.role)

  const [roleText, setRoleText] = useState('')

  const getRole = (role: number, isAgenting: boolean) => {
    let roleStr = ''
    switch (role) {
      case CustomerRole.GUEST:
        roleStr = 'guest'
        break
      case CustomerRole.B2C:
        roleStr = 'b2c'
        break
      case CustomerRole.SUPER_ADMIN:
        roleStr = isAgenting ? 'b2b' : 'b2c'
        break
      default:
        roleStr = 'b2b'
    }
    setRoleText(roleStr)
  }

  useEffect(() => {
    getRole(+role, isAgenting)
  }, [isB2BUser, role, isAgenting])

  return [roleText]
}

export default useRole
