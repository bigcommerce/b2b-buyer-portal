import {
  Suspense,
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
} from 'react'

import {
  Box,
} from '@mui/material'

import {
  Route,
  Routes,
  Outlet,
  useLocation,
  useNavigate,
} from 'react-router-dom'

import type {
  OpenPageState,
} from '@b3/hooks'

import {
  B3Layout,
} from '@/components'
import {
  RegisteredProvider,
} from '@/pages/registered/context/RegisteredContext'

import {
  RouteItem,
  getAllowedRoutes,
  firstLevelRouting,
  RouteFirstLevelItem,
} from '@/shared/routes/routes'

import {
  GlobaledContext,
} from '@/shared/global'

import B3LayoutTip from './B3LayoutTip'

interface B3RenderRouterProps {
  setOpenPage: Dispatch<SetStateAction<OpenPageState>>,
  openUrl?: string,
  isOpen?: boolean,
}

export const B3RenderRouter = (props: B3RenderRouterProps) => {
  const {
    setOpenPage,
    openUrl,
    isOpen,
  } = props

  const {
    state: globaledState,
  } = useContext(GlobaledContext)

  const newRoutes = () => (getAllowedRoutes(globaledState))

  const location = useLocation()

  const navigate = useNavigate()

  useEffect(() => {
    if (location && isOpen) {
      setOpenPage({
        isOpen: true,
        openUrl: location.pathname,
      })
      if (location.state) location.state = null
    }
  }, [location])

  useEffect(() => {
    if (openUrl && openUrl === '/?closeMasqurade=1') {
      navigate('/', {
        state: {
          closeMasqurade: '1',
        },
      })
    }
  }, [openUrl])

  return (
    <Suspense fallback={(
      <Box sx={{
        display: 'flex',
        width: '100%',
        height: '100vh',
        justifyContent: 'center',
        alignItems: 'center',
      }}
      >
        Loading...
      </Box>
      )}
    >
      <B3LayoutTip />
      <Routes>
        <Route
          // path="/"
          element={(
            <B3Layout>
              <Outlet />
            </B3Layout>
          )}
        >
          {
              newRoutes().map((route: RouteItem) => {
                const {
                  path,
                  component: Component,
                } = route
                return (
                  <Route
                    key={path}
                    path={path}
                    element={(<Component setOpenPage={setOpenPage} />)}
                  />
                )
              })
            }
        </Route>
        {
          firstLevelRouting.map((route: RouteFirstLevelItem) => {
            const {
              isProvider,
              path,
              component: Component,
            } = route
            if (isProvider) {
              return (
                <Route
                  key={path}
                  path={path}
                  element={(
                    <RegisteredProvider>
                      <Component setOpenPage={setOpenPage} />
                    </RegisteredProvider>
                )}
                />
              )
            }
            return (
              <Route
                key={path}
                path={route.name}
                element={(
                  <Component setOpenPage={setOpenPage} />
                )}
              />
            )
          })
        }
      </Routes>
    </Suspense>
  )
}
