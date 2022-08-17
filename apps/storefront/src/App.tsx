import {
  useEffect,
  lazy,
  Suspense,
} from 'react'
import {
  HashRouter,
  Route,
  Routes,
  Outlet,
} from 'react-router-dom'
import {
  useB3AppOpen,
} from '@b3/hooks'
import styled from '@emotion/styled'

import {
  Layout,
  RegisteredCloseButton,
  ThemeFrame,
} from '@/components'
import {
  RegisteredProvider,
} from '@/pages/registered/context/RegisteredContext'

const FONT_URL = 'https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap'
const CUSTOM_STYLES = `
body {
  background: #acacac;
  font-family: Roboto;
};
`
const HeaderContainer = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  marginBottom: '1rem',
}))

const PageContainer = styled('div')(() => ({
  padding: '40px',
}))

const {
  height: defaultHeight,
  overflow: defaultOverflow,
} = document.body.style

const Home = lazy(() => import('./pages/Home'))

const Form = lazy(() => import('./pages/Form'))

const Registered = lazy(() => import('./pages/registered/Registered'))

const RegisteredBCToB2B = lazy(() => import('./pages/registered/RegisteredBCToB2B'))

export default function App() {
  const [{
    isOpen,
    openUrl,
  }, setOpenPage] = useB3AppOpen({
    isOpen: false,
  })

  useEffect(() => {
    if (isOpen) {
      document.body.style.height = '100%'
      document.body.style.overflow = 'hidden'
      if (openUrl) {
        window.location.href = `#${openUrl}`
      }
    } else {
      document.body.style.height = defaultHeight
      document.body.style.overflow = defaultOverflow
    }
  }, [isOpen])

  useEffect(() => {
    const {
      host, pathname,
    } = window.location

    if (!/mybigcommerce.com$/.test(host)) {
      return
    }

    if (/login.php/.test(pathname)) {
      setOpenPage({
        isOpen: true,
        openUrl: '/login',
      })
    }
  }, [])

  return (
    <HashRouter>
      <div className="bundle-app">
        <ThemeFrame
          className={isOpen ? 'active-frame' : undefined}
          fontUrl={FONT_URL}
          customStyles={CUSTOM_STYLES}
        >

          {isOpen ? (
            <Suspense fallback={<div>Loading...</div>}>
              <Routes>
                <Route
                  path="/registered"
                  element={(
                    <PageContainer>
                      <HeaderContainer>
                        <RegisteredCloseButton setOpenPage={setOpenPage} />
                      </HeaderContainer>
                      <RegisteredProvider>
                        <Registered setOpenPage={setOpenPage} />
                      </RegisteredProvider>
                    </PageContainer>
                )}
                />
                <Route
                  path="/registeredbctob2b"
                  element={(
                    <PageContainer>
                      <HeaderContainer>
                        <RegisteredCloseButton setOpenPage={setOpenPage} />
                      </HeaderContainer>
                      <RegisteredProvider>
                        <RegisteredBCToB2B />
                      </RegisteredProvider>
                    </PageContainer>
                )}
                />
                <Route
                  path="/"
                  element={(
                    <Layout close={() => setOpenPage({
                      isOpen: false,
                    })}
                    >
                      <HeaderContainer>
                        <RegisteredCloseButton setOpenPage={setOpenPage} />
                      </HeaderContainer>
                      <Outlet />
                    </Layout>
                )}
                >
                  <Route
                    path="/"
                    element={<Home />}
                  />
                  <Route
                    path="form"
                    element={<Form />}
                  />
                </Route>
              </Routes>
            </Suspense>
          ) : null}
        </ThemeFrame>
      </div>
    </HashRouter>
  )
}
