import { useEffect } from 'react'
import { Box } from '@mui/material'

import { getAgentInfo } from '@/shared/service/b2b'
import { useAppSelector } from '@/store'
import { b2bLogger, B3SStorage } from '@/utils'

function SeleRep() {
  const customerId = useAppSelector(({ company }) => company.customer.id)
  const role = useAppSelector(({ company }) => company.customer.role)

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
          b2bLogger.error(error)
        }
      }
    }

    init()
    // disabling as we only need to run this once and values at starting render are good enough
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <Box>111111</Box>
}

export default SeleRep
