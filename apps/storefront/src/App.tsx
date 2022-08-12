import {
  useEffect,
  lazy,
  Suspense,
} from 'react'
import {
  HashRouter,
  Route,
  Routes,
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

const {
  height: defaultHeight,
  overflow: defaultOverflow,
} = document.body.style

const Home = lazy(() => import('./pages/Home'))

const Form = lazy(() => import('./pages/Form'))

const Registered = lazy(() => import('./pages/registered/Registered'))

const RegisteredBCToB2B = lazy(() => import('./pages/registered/RegisteredBCToB2B'))

export default function App() {
  const [isOpen, setIsOpen] = useB3AppOpen(false)

  useEffect(() => {
    if (isOpen) {
      document.body.style.height = '100%'
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.height = defaultHeight
      document.body.style.overflow = defaultOverflow
    }
  }, [isOpen])

  return (
    <HashRouter>
      <div className="bundle-app">
        <ThemeFrame
          className={isOpen ? 'active-frame' : undefined}
          fontUrl={FONT_URL}
          customStyles={CUSTOM_STYLES}
        >

          {isOpen ? (
            <Layout close={() => setIsOpen(false)}>
              <HeaderContainer>
                <RegisteredCloseButton setIsOpen={setIsOpen} />
              </HeaderContainer>
              <Suspense fallback={<div>Loading...</div>}>
                <Routes>
                  <Route
                    path="/"
                    element={<Home />}
                  />
                  <Route
                    path="/form"
                    element={<Form />}
                  />
                  <Route
                    path="/registered"
                    element={(
                      <RegisteredProvider>
                        <Registered setIsOpen={setIsOpen} />
                      </RegisteredProvider>
                  )}
                  />
                  <Route
                    path="/registeredbctob2b"
                    element={(
                      <RegisteredProvider>
                        <RegisteredBCToB2B />
                      </RegisteredProvider>
                  )}
                  />
                </Routes>
              </Suspense>
            </Layout>
          ) : null}
        </ThemeFrame>
      </div>
    </HashRouter>
  )
}
