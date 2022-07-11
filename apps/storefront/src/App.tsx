import { HashRouter, Route, Routes } from 'react-router-dom'
import { useB3AppOpen } from '@b3/hooks'

import { ThemeFrame } from './ThemeFrame'
import { Home, Form } from './pages'
import { Layout } from './components'

const FONT_URL = 'https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap'
const CUSTOM_STYLES = `
body {
  background: #acacac;
  font-family: Roboto;
};
`

export default function App() {
  const [isOpen, setIsOpen] = useB3AppOpen(false)

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
              bundle b2b
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/form" element={<Form />} />
              </Routes>
            </Layout>
          ) : null}
        </ThemeFrame>
      </div>
    </HashRouter>
  )
}
