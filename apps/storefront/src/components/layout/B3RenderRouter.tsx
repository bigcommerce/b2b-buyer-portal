import { lazy, Suspense, useContext, useEffect } from 'react';
import { Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom';

import { RegisteredProvider } from '@/pages/Registered/context/RegisteredContext';
import { type SetOpenPage } from '@/pages/SetOpenPage';
import { GlobalContext } from '@/shared/global';
import { RouteFirstLevelItem, RouteItem } from '@/shared/routeList';
import { firstLevelRouting, getAllowedRoutes } from '@/shared/routes';
import { getPageTranslations, useAppDispatch } from '@/store';
import { channelId } from '@/utils';

import Loading from '../loading/Loading';

import { RedirectFallback } from './B3FallbackRoute';

const B3Layout = lazy(() => import('@/components/layout/B3Layout'));

const B3LayoutTip = lazy(() => import('@/components/layout/B3LayoutTip'));

interface B3RenderRouterProps {
  setOpenPage: SetOpenPage;
  openUrl?: string;
  isOpen: boolean;
}

export default function B3RenderRouter(props: B3RenderRouterProps) {
  const { setOpenPage, openUrl, isOpen } = props;
  const { state: globalState } = useContext(GlobalContext);
  const routes = getAllowedRoutes(globalState);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (openUrl === '/dashboard') {
      location.state = null;
      navigate(openUrl);
    } else if (typeof openUrl === 'string') {
      navigate(openUrl);
    }
    //
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openUrl, isOpen]);

  useEffect(
    () => {
      const [, page] = location.pathname.split('/');
      if (!page) return;

      dispatch(
        getPageTranslations({
          channelId: globalState.multiStorefrontEnabled ? channelId : 0,
          page,
        }),
      );
    },
    // ignore dispatch
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [globalState.multiStorefrontEnabled, location.pathname],
  );

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
          {routes.map((route: RouteItem) => {
            const { path, component: Component } = route;
            return (
              <Route key={path} path={path} element={<Component setOpenPage={setOpenPage} />} />
            );
          })}
          <Route
            path="*"
            element={<RedirectFallback path={routes[0]?.path} setOpenPage={setOpenPage} />}
          />
        </Route>
        {firstLevelRouting.map((route: RouteFirstLevelItem) => {
          const { isProvider, path, component: Component } = route;
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
            );
          }
          return <Route key={path} path={path} element={<Component setOpenPage={setOpenPage} />} />;
        })}
      </Routes>
    </Suspense>
  );
}
