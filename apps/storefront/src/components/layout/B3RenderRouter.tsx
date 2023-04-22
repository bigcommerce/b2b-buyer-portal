import {
  Dispatch,
  SetStateAction,
  Suspense,
  useContext,
  useEffect,
} from 'react'
import {
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import type { OpenPageState } from '@b3/hooks'

import { B3Layout, Loading } from '@/components'
import { RegisteredProvider } from '@/pages/registered/context/RegisteredContext'
import { GlobaledContext } from '@/shared/global'
import {
  firstLevelRouting,
  getAllowedRoutes,
  RouteFirstLevelItem,
  RouteItem,
} from '@/shared/routes/routes'

import B3LayoutTip from './B3LayoutTip'

interface B3RenderRouterProps {
  setOpenPage: Dispatch<SetStateAction<OpenPageState>>
  openUrl?: string
  isOpen?: boolean
}

export default function B3RenderRouter(props: B3RenderRouterProps) {
  const { setOpenPage, openUrl, isOpen } = props

  const { state: globaledState } = useContext(GlobaledContext)

  const newRoutes = () => getAllowedRoutes(globaledState)

  const location = useLocation()

  const navigate = useNavigate()

  useEffect(() => {
    if (location && isOpen) {
      setOpenPage({
        isOpen: true,
        openUrl: location.pathname,
      })
      if (location.state && location.pathname.includes('dashboard'))
        location.state = null
    }
  }, [location])

  useEffect(() => {
    if (openUrl && openUrl === '/dashboard?closeMasqurade=1') {
      navigate('/dashboard', {
        state: {
          closeMasqurade: '1',
        },
      })
    }
  }, [openUrl])

  return (
    <Suspense fallback={<Loading />}>
      <B3LayoutTip />
      <Routes>
        <Route
          // path="/"
          element={
            <B3Layout>
              <Outlet />
            </B3Layout>
          }
        >
          {newRoutes().map((route: RouteItem) => {
            const { path, component: Component } = route
            return (
              <Route
                key={path}
                path={path}
                element={<Component setOpenPage={setOpenPage} />}
              />
            )
          })}
        </Route>
        {firstLevelRouting.map((route: RouteFirstLevelItem) => {
          const { isProvider, path, component: Component } = route
          if (isProvider) {
            return (
              <Route
                key={path}
                path={path}
                element={
                  <RegisteredProvider>
                    <Component setOpenPage={setOpenPage} />
                  </RegisteredProvider>
                }
              />
            )
          }
          return (
            <Route
              key={path}
              path={route.name}
              element={<Component setOpenPage={setOpenPage} />}
            />
          )
        })}
      </Routes>
    </Suspense>
  )
}
