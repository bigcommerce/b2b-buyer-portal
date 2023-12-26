import { ReactNode, useContext, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Box, useMediaQuery } from '@mui/material'

import useMobile from '@/hooks/useMobile'
import { DynamicallyVariableedContext } from '@/shared/dynamicallyVariable'
import { GlobaledContext } from '@/shared/global'
import { routes } from '@/shared/routes'
import { getIsTokenGotoPage, RouteItem } from '@/shared/routes/routes'

import B3Dialog from '../B3Dialog'

import B3Logo from './B3Logo'
import B3Mainheader from './B3Mainheader'
import B3MobileLayout from './B3MobileLayout'
import B3Nav from './B3Nav'

export default function B3Layout({ children }: { children: ReactNode }) {
  const [isMobile] = useMobile()
  const isDesktopLimit = useMediaQuery('(min-width:1775px)')

  const location = useLocation()

  const [title, setTitle] = useState<string>('')

  const {
    state: {
      emailAddress,
      customerId,
      // globalMessageDialog,
    },
    // dispatch,
  } = useContext(GlobaledContext)

  const {
    state: { globalMessageDialog },
    dispatch,
  } = useContext(DynamicallyVariableedContext)

  const navigate = useNavigate()

  useEffect(() => {
    if (
      (!emailAddress || !customerId) &&
      !getIsTokenGotoPage(location.pathname)
    ) {
      navigate('/login')
    }
  }, [emailAddress, customerId, location])

  useEffect(() => {
    const itemsRoutes = routes.filter(
      (item: RouteItem) => item.path === location.pathname
    )
    if (itemsRoutes.length && location.pathname !== '/quoteDraft') {
      setTitle(itemsRoutes[0].pageTitle || itemsRoutes[0].name)
    } else {
      setTitle('')
    }
    dispatch({
      type: 'common',
      payload: {
        tipMessage: {
          msgs: [],
        },
      },
    })
  }, [location])

  const messageDialogClose = () => {
    dispatch({
      type: 'common',
      payload: {
        globalMessageDialog: {
          open: false,
          title: '',
          message: '',
          cancelText: 'Cancel',
        },
      },
    })
  }

  return (
    <Box>
      {isMobile ? (
        <B3MobileLayout title={title}>{children}</B3MobileLayout>
      ) : (
        // <Box
        //   sx={{
        //     p: '40px 30px',
        //     minHeight: '100vh',
        //     display: 'flex',
        //     backgroundColor: '#d2d2d3',
        //   }}
        // >
        <Box
          id="app-mainPage-layout"
          sx={{
            display: 'flex',
            minHeight: '100vh',
            margin: 'auto',
            width: !isDesktopLimit ? '100%' : 1775,
            minWidth: !isDesktopLimit ? '100%' : 1775,
            maxWidth: !isDesktopLimit ? '100%' : 1775,
            flexDirection: 'row',
            p: '32px 63px 70px 63px',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              width: '199px',
              displayPrint: 'none',
            }}
          >
            <B3Logo />
            <Box
              sx={{
                pt: '24px',
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
              maxWidth: '1450px',
              width: '100%',
              p: '0 0px 0px 50px',
            }}
          >
            <B3Mainheader title={title} />
            <Box
              component="main"
              sx={
                {
                  // flexGrow: 1,
                }
              }
            >
              {children}
            </Box>
          </Box>
        </Box>

        // </Box>
      )}

      <B3Dialog
        isOpen={globalMessageDialog.open}
        title={globalMessageDialog.title}
        leftSizeBtn={globalMessageDialog.cancelText}
        rightSizeBtn={globalMessageDialog.saveText}
        handleLeftClick={globalMessageDialog.cancelFn || messageDialogClose}
        handRightClick={globalMessageDialog.saveFn}
        showRightBtn={!!globalMessageDialog.saveText}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: `${isMobile ? 'center' : 'start'}`,
            width: `${isMobile ? '100%' : '450px'}`,
            height: '100%',
          }}
        >
          {globalMessageDialog.message}
        </Box>
      </B3Dialog>
    </Box>
  )
}
