import { ReactNode, useContext, useState } from 'react'
import { Close, Dehaze, ShoppingBagOutlined } from '@mui/icons-material'
import { Badge, Box } from '@mui/material'

import { CustomStyleContext } from '@/shared/customStyleButtton'
import { GlobaledContext } from '@/shared/global'
import { store } from '@/store'

import CompanyCredit from '../CompanyCredit'
import { getContrastColor } from '../outSideComponents/utils/b3CustomStyles'

import B3AccountInfo from './B3AccountInfo'
import B3CloseAppButton from './B3CloseAppButton'
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
    state: { isAgenting, role },
  } = useContext(GlobaledContext)

  const {
    state: {
      portalStyle: { backgroundColor = '#FEF9F5' },
    },
  } = useContext(CustomStyleContext)
  const { global } = store.getState()

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
        <Badge badgeContent={0} color="secondary">
          <Dehaze onClick={openRouteList} sx={{ color: customColor }} />
        </Badge>

        <B3Logo />

        {role === 2 ? (
          <Box sx={{ width: '24px' }} />
        ) : (
          <>
            <Badge
              badgeContent={global?.cartNumber}
              max={1000}
              sx={{
                '& .MuiBadge-badge': {
                  color: '#FFFFFF',
                  backgroundColor: '#1976D2',
                  fontWeight: 500,
                  fontSize: '12px',
                  minWidth: '18px',
                  height: '18px',
                  top: '8px',
                  right: '3px',
                },
              }}
            >
              <ShoppingBagOutlined
                sx={{ color: 'rgba(0, 0, 0, 0.54)' }}
                onClick={() => {
                  window.location.href = '/cart.php'
                }}
              />
            </Badge>
            <Box
              sx={{
                marginLeft: '2px',
                height: '24px',
              }}
            >
              <B3CloseAppButton />
            </Box>
          </>
        )}
      </Box>

      <Box
        component="h1"
        sx={{
          p: 0,
          m: 0,
          mb: '6vw',
          fontSize: '34px',
          fontWeight: '400',
          color: customColor || '#263238',
        }}
      >
        {title}
      </Box>
      <CompanyCredit />
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
            left: 0,
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
            <B3AccountInfo closeSidebar={setOpenMobileSidebar} />
            <Close onClick={() => setOpenMobileSidebar(false)} />
          </Box>

          <B3Nav closeSidebar={setOpenMobileSidebar} />
        </Box>
      )}
    </Box>
  )
}
