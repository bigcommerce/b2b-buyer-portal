import { ReactNode, useContext, useState } from 'react'
import { Close, Dehaze } from '@mui/icons-material'
import { Badge, Box } from '@mui/material'

import { CustomStyleContext } from '@/shared/customStyleButtton'
import { GlobaledContext } from '@/shared/global'

import { getContrastColor } from '../outSideComponents/utils/b3CustomStyles'

import B3AccountInfo from './B3AccountInfo'
import B3Logo from './B3Logo'
import B3Nav from './B3Nav'

export default function B3MobileLayout({
  children,
  title,
}: {
  children: ReactNode
  title: string
}) {
  const [isOpenMobileSidebar, setOpenMobileSidebar] = useState<boolean>(false)
  const openRouteList = () => {
    setOpenMobileSidebar(true)
  }

  const {
    state: { companyInfo, salesRepCompanyName, isAgenting, role },
  } = useContext(GlobaledContext)

  const {
    state: {
      portalStyle: { backgroundColor = '#FEF9F5' },
    },
  } = useContext(CustomStyleContext)

  const customColor = getContrastColor(backgroundColor)

  return (
    <Box
      sx={{
        height: '70vh',
        p: '4vw',
        display: 'flex',
        flexDirection: 'column',
        // marginBottom: isAgenting ? '52px' : '0',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: '4.5vw',
        }}
      >
        <B3Logo />

        <Badge badgeContent={0} color="secondary">
          <Dehaze onClick={openRouteList} sx={{ color: customColor }} />
        </Badge>
      </Box>

      <Box
        component="h1"
        sx={{
          p: 0,
          m: 0,
          mb: '2vw',
          fontSize: '34px',
          fontWeight: '400',
          color: customColor || '#263238',
        }}
      >
        {title}
      </Box>
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          paddingBottom: isAgenting ? '52px' : '0',
          // marginBottom: isAgenting ? '-52px' : '0',
          // position: 'relative',
          // overflow: 'hidden',
        }}
      >
        {children}
      </Box>
      {isOpenMobileSidebar && (
        <Box
          sx={{
            height: '100vh',
            position: 'fixed',
            width: '92vw',
            zIndex: 1000,
            right: 0,
            top: 0,
            p: '4vw',
            backgroundColor: 'white',
            boxShadow:
              '0px 7px 8px -4px #00000033, 0px 12px 17px 2px #00000024, 0px 5px 22px 4px #0000001f',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              pb: '4vw',
            }}
          >
            <Box
              component="h4"
              sx={{
                p: 0,
                m: 0,
                fontSize: '20px',
              }}
            >
              {companyInfo?.companyName || salesRepCompanyName}
            </Box>
            <Close onClick={() => setOpenMobileSidebar(false)} />
          </Box>

          <B3Nav closeSidebar={setOpenMobileSidebar} />
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
            }}
          >
            {role !== 100 && (
              <B3AccountInfo closeSidebar={setOpenMobileSidebar} />
            )}
          </Box>
        </Box>
      )}
    </Box>
  )
}
