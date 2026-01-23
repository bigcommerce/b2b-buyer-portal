import { Suspense, useContext, useEffect } from 'react';
import { Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom';

import B3Layout from '@/components/layout/B3Layout';
import B3LayoutTip from '@/components/layout/B3LayoutTip';
import { type SetOpenPage } from '@/pages/SetOpenPage';
import { GlobalContext } from '@/shared/global';
import { RouteItem } from '@/shared/routeList';
import { firstLevelRouting, getAllowedRoutes } from '@/shared/routes';
import { getPageTranslations, useAppDispatch } from '@/store';
import { channelId } from '@/utils/basicConfig';

import Loading from '../loading/Loading';

import { RedirectFallback } from './B3FallbackRoute';

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

      if (!page) {
        return;
      }

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
              <Route element={<Component setOpenPage={setOpenPage} />} key={path} path={path} />
            );
          })}
          <Route
            element={<RedirectFallback path={routes[0]?.path} setOpenPage={setOpenPage} />}
            path="*"
          />
        </Route>
        {firstLevelRouting.map(({ path, component: Component }) => (
          <Route element={<Component setOpenPage={setOpenPage} />} key={path} path={path} />
        ))}
      </Routes>
    </Suspense>
  );
}
