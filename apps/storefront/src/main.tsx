import ReactDOM from 'react-dom/client'
import { LangProvider } from '@b3/lang'

import App from './App'
import B3ThemeProvider from './theme'

import './main.css'
import * as locales from './locales'

const CONTAINER_ID = 'bundle-container'

let container = document.getElementById(CONTAINER_ID)
if (!container) {
  container = document.createElement('div')
  container.id = CONTAINER_ID
  document.body.appendChild(container)
}

container.className = 'bundle-namespace'

ReactDOM.createRoot(container).render(
  <LangProvider locales={locales}>
    <B3ThemeProvider>
      <App />
    </B3ThemeProvider>
  </LangProvider>,
)
