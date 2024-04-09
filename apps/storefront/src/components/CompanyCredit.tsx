import { useContext, useEffect, useState } from 'react'
import { useB3Lang } from '@b3/lang'
import { Alert, Box } from '@mui/material'

import { GlobaledContext } from '@/shared/global'
import { getCompanyCreditConfig } from '@/shared/service/b2b'
import { useAppSelector } from '@/store'
import { B3SStorage } from '@/utils'

const permissionRoles = [0, 1, 2]

function CompanyCredit() {
  const {
    state: { isAgenting },
  } = useContext(GlobaledContext)
  const role = useAppSelector(({ company }) => company.customer.role)

  const [isEnabled, setEnabled] = useState<boolean>(false)

  const b3Lang = useB3Lang()

  useEffect(() => {
    const init = async () => {
      const isCloseCompanyCredit = B3SStorage.get('isCloseCompanyCredit')

      if (isCloseCompanyCredit) return

      if (permissionRoles.includes(+role) || (+role === 3 && isAgenting)) {
        const {
          companyCreditConfig: { creditHold, creditEnabled },
        } = await getCompanyCreditConfig()

        setEnabled(creditHold && creditEnabled)
      }
    }

    init()
  }, [role, isAgenting])

  const handleCompanyCreditCloseClick = () => {
    B3SStorage.set('isCloseCompanyCredit', true)
    setEnabled(false)
  }

  if (!isEnabled) return null

  return (
    <Box
      sx={{
        margin: '1rem 0',
      }}
    >
      <Alert
        variant="filled"
        onClose={() => handleCompanyCreditCloseClick()}
        severity="warning"
      >
        {b3Lang('global.companyCredit.alert')}
      </Alert>
    </Box>
  )
}

export default CompanyCredit
