import { HashRouter, Route, Routes } from 'react-router-dom'
import { useB3AppOpen } from '@b3/hooks'
import styled from '@emotion/styled'

import { ThemeFrame } from './ThemeFrame'
import { Home, Form, Registered } from './pages'
import { Layout, RegisteredCloseButton } from './components'
import { RegisteredProvider } from './pages/registered/context/RegisteredContext'

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
  justifyContent: 'space-between',
}))

export default function App() {
  const [isOpen, setIsOpen] = useB3AppOpen(false)

  return (
    <RegisteredProvider>
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
                  <p>bundle b2b</p>
                  <RegisteredCloseButton />
                </HeaderContainer>
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
                    element={<Registered />}
                  />
                </Routes>
              </Layout>
            ) : null}
          </ThemeFrame>
        </div>
      </HashRouter>
    </RegisteredProvider>
  )
}
