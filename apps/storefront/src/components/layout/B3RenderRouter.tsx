import {
  Dispatch,
  lazy,
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

import Loading from '@/components/loadding/Loading'
// import { B3Layout, Loading } from '@/components'
import { RegisteredProvider } from '@/pages/registered/context/RegisteredContext'
import { GlobaledContext } from '@/shared/global'
import {
  firstLevelRouting,
  getAllowedRoutes,
  RouteFirstLevelItem,
  RouteItem,
} from '@/shared/routes/routes'

// import B3LayoutTip from './B3LayoutTip'

const B3Layout = lazy(() => import('@/components/layout/B3Layout'))

const B3LayoutTip = lazy(() => import('@/components/layout/B3LayoutTip'))

interface B3RenderRouterProps {
  setOpenPage: Dispatch<SetStateAction<OpenPageState>>
  openUrl?: string
}

export default function B3RenderRouter(props: B3RenderRouterProps) {
  const { setOpenPage, openUrl } = props

  const { state: globaledState } = useContext(GlobaledContext)

  const newRoutes = () => getAllowedRoutes(globaledState)

  const location = useLocation()

  const navigate = useNavigate()

  useEffect(() => {
    if (openUrl && openUrl === '/dashboard?closeMasqurade=1') {
      navigate('/dashboard', {
        state: {
          closeMasqurade: '1',
        },
      })
    } else if (openUrl === '/dashboard') {
      location.state = null
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
              path={path}
              element={<Component setOpenPage={setOpenPage} />}
            />
          )
        })}
      </Routes>
    </Suspense>
  )
}
