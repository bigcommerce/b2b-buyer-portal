import { useContext } from 'react'
import { Box } from '@mui/material'

import { CustomStyleContext } from '@/shared/customStyleButtton'
import { GlobaledContext } from '@/shared/global'

import { getContrastColor } from '../outSideComponents/utils/b3CustomStyles'

import B3AccountInfo from './B3AccountInfo'
import B3StatusNotification from './B3StatusNotification'

export default function B3Mainheader({ title }: { title: string }) {
  const {
    state: { companyInfo, salesRepCompanyName, role },
  } = useContext(GlobaledContext)

  const {
    state: {
      portalStyle: { backgroundColor = '#FEF9F5' },
    },
  } = useContext(CustomStyleContext)

  const customColor = getContrastColor(backgroundColor)

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
            color: customColor || '#333333',
          }}
        >
          {+role === 3 &&
            (companyInfo?.companyName || salesRepCompanyName || 'Super admin')}
        </Box>
        {role !== 100 && <B3AccountInfo />}
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
            color: customColor,
          }}
        >
          {title}
        </Box>
      )}
      <B3StatusNotification title={title} />
    </Box>
  )
}
