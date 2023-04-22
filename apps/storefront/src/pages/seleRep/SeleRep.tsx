import { useContext, useEffect } from 'react'
import { Box } from '@mui/material'

import { GlobaledContext } from '@/shared/global'
import { getAgentInfo } from '@/shared/service/b2b'
import {
  B3SStorage,
  // storeHash,
} from '@/utils'

function SeleRep() {
  const {
    state: {
      // isB2BUser,
      // isAgenting,
      role,
      customerId,
    },
    dispatch,
  } = useContext(GlobaledContext)

  useEffect(() => {
    const init = async () => {
      let isAgenting = false
      let salesRepCompanyId = ''
      let salesRepCompanyName = ''

      if (role === 3) {
        try {
          const data: any = await getAgentInfo(customerId)
          if (data?.companyId) {
            B3SStorage.set('isAgenting', true)
            salesRepCompanyId = data.companyId
            salesRepCompanyName = data.companyName
            isAgenting = true

            dispatch({
              type: 'common',
              payload: {
                salesRepCompanyId,
                salesRepCompanyName,
                isAgenting,
              },
            })
          }
        } catch (error) {
          console.log(error)
        }
      }
    }

    init()
  }, [])

  return <Box>111111</Box>
}

export default SeleRep
