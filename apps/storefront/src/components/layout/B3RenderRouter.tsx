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
  B3Layout,
} from '@/components'
import {
  RegisteredProvider,
} from '@/pages/registered/context/RegisteredContext'

import {
  RouteItem,
  getAllowedRoutes,
} from '@/shared/routes/routes'

import {
  GlobaledContext,
} from '@/shared/global'

import B3LayoutTip from './B3LayoutTip'

const Registered = lazy(() => import('../../pages/registered/Registered'))

const RegisteredBCToB2B = lazy(() => import('../../pages/registered/RegisteredBCToB2B'))

const Login = lazy(() => import('../../pages/login/Login'))

const ForgotPassword = lazy(() => import('../../pages/login/ForgotPassword'))

const PDP = lazy(() => import('../../pages/pdp/PDP'))

interface B3RenderRouterProps {
  setOpenPage: Dispatch<SetStateAction<OpenPageState>>,

}

export const B3RenderRouter = (props: B3RenderRouterProps) => {
  const {
    setOpenPage,
  } = props

  const {
    state: globaledState,
  } = useContext(GlobaledContext)

  const newRoutes = () => (getAllowedRoutes(globaledState))

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
          path="pdp"
          element={<PDP setOpenPage={setOpenPage} />}
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
