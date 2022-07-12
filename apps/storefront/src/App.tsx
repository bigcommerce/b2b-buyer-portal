import { HashRouter, Route, Routes } from 'react-router-dom'
import { useB3AppOpen } from '@b3/hooks'
import { useB3Lang, useB3CurrentLang } from '@b3/lang'

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
  const b3Lang = useB3Lang()
  const [lang, setLang] = useB3CurrentLang()

  return (
    <HashRouter>
      <div className="bundle-app">
        <div>{b3Lang('intl.users.register')}</div>
        <button onClick={() => { setLang(lang === 'zh' ? 'en' : 'zh') }}>update lang</button>
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
