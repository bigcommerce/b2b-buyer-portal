import { useContext } from 'react'
import { Box } from '@mui/material'

import { GlobaledContext } from '@/shared/global'

import B3AccountInfo from './B3AccountInfo'

export default function B3Mainheader({ title }: { title: string }) {
  const {
    state: { companyInfo, salesRepCompanyName, role },
  } = useContext(GlobaledContext)

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          height: '70px',
          alignItems: 'center',
        }}
      >
        <Box
          component="h4"
          sx={{
            fontSize: '20px',
            fontWeight: '500',
            color: '#333333',
          }}
        >
          {+role === 3 &&
            (companyInfo?.companyName || salesRepCompanyName || 'Super admin')}
        </Box>
        <B3AccountInfo />
      </Box>
      {title && (
        <Box
          component="h3"
          sx={{
            height: '40px',
            m: '0',
            fontSize: '34px',
            fontWeight: 400,
            lineHeight: '42px',
            display: 'flex',
            alignItems: 'end',
            mb: '8px',
          }}
        >
          {title}
        </Box>
      )}
    </Box>
  )
}
