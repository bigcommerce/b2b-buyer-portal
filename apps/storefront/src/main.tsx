import './main.css'

import ReactDOM from 'react-dom/client'
import { LangProvider } from '@b3/lang'

import App from './App'
import B3ThemeProvider from './theme'

import * as locales from './locales'
import { SUPPORT_LANGUAGE } from './constants'

const CONTAINER_ID = 'bundle-container'

let container = document.getElementById(CONTAINER_ID)
if (!container) {
  container = document.createElement('div')
  container.id = CONTAINER_ID
  document.body.appendChild(container)
}

container.className = 'bundle-namespace'

ReactDOM.createRoot(container).render(
  <LangProvider
    locales={locales}
    supportLang={SUPPORT_LANGUAGE}
  >
    <B3ThemeProvider>
      <App />
    </B3ThemeProvider>
  </LangProvider>,
)
