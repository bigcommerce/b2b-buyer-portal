import {
  useState,
  ReactNode,
  useContext,
} from 'react'
import {
  Box,
  Badge,
} from '@mui/material'

import {
  DensityMedium,
  Close,
} from '@mui/icons-material'

import {
  GlobaledContext,
} from '@/shared/global'

import {
  B3Logo,
} from './B3Logo'

import {
  B3Nav,
} from './B3Nav'

import {
  B3AccountInfo,
} from './B3AccountInfo'

export const B3MobileLayout = ({
  children,
  title,
}: {
  children: ReactNode;
  title: string,
}) => {
  const [isOpenMobileSidebar, setOpenMobileSidebar] = useState<boolean>(false)
  const openRouteList = () => {
    setOpenMobileSidebar(true)
  }

  const {
    state: {
      companyInfo,
      salesRepCompanyName,
    },
  } = useContext(GlobaledContext)

  return (
    <Box
      sx={{
        height: '100vh',
        p: '4vw',
        backgroundColor: '#fef9f5',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: '5vw',
        }}
      >
        <B3Logo />

        <Badge
          badgeContent={0}
          color="secondary"
        >
          <DensityMedium onClick={openRouteList} />
        </Badge>
      </Box>

      <Box
        component="h1"
        sx={{
          p: 0,
          m: 0,
          mb: '2vw',
        }}
      >
        {
            title
          }
      </Box>
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {children}
      </Box>
      {
        isOpenMobileSidebar && (
        <Box
          sx={{
            height: '100vh',
            position: 'fixed',
            width: '95vw',
            zIndex: 10,
            right: 0,
            top: 0,
            p: '4vw',
            backgroundColor: 'white',
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
              }}
            >
              {companyInfo?.companyName || salesRepCompanyName}
            </Box>
            <Close onClick={() => setOpenMobileSidebar(false)} />
          </Box>

          <B3Nav
            closeSidebar={setOpenMobileSidebar}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
            }}
          >
            <B3AccountInfo
              closeSidebar={setOpenMobileSidebar}
            />
          </Box>
        </Box>
        )
      }

    </Box>
  )
}
