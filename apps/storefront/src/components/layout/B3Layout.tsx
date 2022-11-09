import {
  useContext,
  useEffect,
  ReactNode,
} from 'react'

import {
  Box,
} from '@mui/material'

import {
  useNavigate,
} from 'react-router-dom'
import {
  useMobile,
} from '@/hooks'

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
  B3MobileLayout,
} from './B3MobileLayout'

import {
  B3Mainheader,
} from './B3Mainheader'

export function B3Layout({
  children,
}: {
  children: ReactNode;
}) {
  const [isMobile] = useMobile()

  const {
    state: {
      emailAddress,
      customerId,
    },
  } = useContext(GlobaledContext)

  const navigate = useNavigate()

  useEffect(() => {
    if (!emailAddress || !customerId) {
      navigate('/login')
    }
  }, [emailAddress, customerId])

  return (
    <Box>

      {
        isMobile ? (
          <B3MobileLayout>
            {children}
          </B3MobileLayout>
        )
          : (
        // <Box
        //   sx={{
        //     p: '40px 30px',
        //     minHeight: '100vh',
        //     display: 'flex',
        //     backgroundColor: '#d2d2d3',
        //   }}
        // >
            <Box
              sx={{
                display: 'flex',
                minHeight: '100vh',
                width: '100%',
                flexDirection: 'row',
                p: '20px',
                backgroundColor: '#fef9f5',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  minWidth: '250px',
                  pl: '20px',
                  backgroundColor: '#fef9f5',
                }}
              >
                <B3Logo />
                <Box
                  sx={{
                    pt: '40px',
                  }}
                >
                  <B3Nav />
                </Box>
              </Box>

              <Box
                sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  p: '0 24px 50px 50px',
                }}
              >
                <B3Mainheader />
                <Box
                  component="main"
                  sx={{
                    flexGrow: 1,
                    bgcolor: '#fef9f5',
                  }}
                >
                  {children}
                </Box>
              </Box>

            </Box>

        // </Box>
          )
      }
    </Box>

  )
}
