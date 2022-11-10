import {
  lazy,
  Suspense,
  Dispatch,
  SetStateAction,
  useContext,
} from 'react'

import {
  Box,
} from '@mui/material'

import {
  Route,
  Routes,
  Outlet,
} from 'react-router-dom'

import type {
  OpenPageState,
} from '@b3/hooks'
import {
  routes,
} from '@/shared/routes'

import {
  B3Layout,
} from '@/components'
import {
  RegisteredProvider,
} from '@/pages/registered/context/RegisteredContext'

import {
  RouteItem,
} from '@/shared/routes/routes'

import {
  GlobaledContext,
} from '@/shared/global'

const Registered = lazy(() => import('../../pages/registered/Registered'))

const RegisteredBCToB2B = lazy(() => import('../../pages/registered/RegisteredBCToB2B'))

const Login = lazy(() => import('../../pages/login/Login'))

const ForgotPassword = lazy(() => import('../../pages/login/ForgotPassword'))

interface B3RenderRouterProps {
  setOpenPage: Dispatch<SetStateAction<OpenPageState>>,

}

export const B3RenderRouter = (props: B3RenderRouterProps) => {
  const {
    setOpenPage,
  } = props

  const {
    state: {
      isB2BUser,
      isAgenting,
      role,
    },
  } = useContext(GlobaledContext)

  const newRoutes = () => {
    let newRoutes = routes

    if (!isB2BUser) newRoutes = routes.filter((item:RouteItem) => item.path !== '/company-orders')

    return newRoutes
  }

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
      <Routes>
        <Route
          path="/"
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
                    element={<Component />}
                  />
                )
              })
            }
        </Route>
        <Route
          path="registered"
          element={(
            <RegisteredProvider>
              <Registered setOpenPage={setOpenPage} />
            </RegisteredProvider>
              )}
        />
        <Route
          path="login"
          element={<Login setOpenPage={setOpenPage} />}
        />
        <Route
          path="forgotpassword"
          element={<ForgotPassword setOpenPage={setOpenPage} />}
        />
        <Route
          path="registeredbctob2b"
          element={(
            <RegisteredProvider>
              <RegisteredBCToB2B setOpenPage={setOpenPage} />
            </RegisteredProvider>
              )}
        />
      </Routes>
    </Suspense>
  )
}
