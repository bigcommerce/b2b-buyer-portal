import {
  useContext,
  useEffect,
  ReactNode,
  useState,
} from 'react'

import {
  Box,
} from '@mui/material'

import {
  useNavigate,
  useLocation,
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

import {
  routes,
} from '@/shared/routes'

import {
  RouteItem,
} from '@/shared/routes/routes'

export function B3Layout({
  children,
}: {
  children: ReactNode;
}) {
  const [isMobile] = useMobile()

  const location = useLocation()

  const [title, setTitle] = useState<string>('')

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

  useEffect(() => {
    const itemsRoutes = routes.filter((item: RouteItem) => item.path === location.pathname)
    if (itemsRoutes.length) {
      setTitle(itemsRoutes[0].name)
    } else {
      setTitle('')
    }
  }, [location])

  return (
    <Box>

      {
        isMobile ? (
          <B3MobileLayout title={title}>
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
                  width: '250px',
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
                <B3Mainheader title={title} />
                <Box
                  component="main"
                  sx={{
                    // flexGrow: 1,
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
