import { useContext, useEffect, useState } from 'react'

import { GlobaledContext } from '@/shared/global'

const useRole = () => {
  const {
    state: { isB2BUser, role, isAgenting },
  } = useContext(GlobaledContext)

  const [roleText, setRoleText] = useState('')

  const getRole = (role: number, isAgenting: boolean) => {
    let roleStr = ''
    switch (role) {
      case 100:
        roleStr = 'guest'
        break
      case 99:
        roleStr = 'b2c'
        break
      case 3:
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
