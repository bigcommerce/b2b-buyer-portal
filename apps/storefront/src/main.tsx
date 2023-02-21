import './main.css'

import ReactDOM from 'react-dom/client'
import {
  LangProvider,
} from '@b3/lang'

import {
  GlobalProvider,
} from '@/shared/global'
import {
  DynamicallyVariableProvider,
} from '@/shared/dynamicallyVariable'

import App from './App'
import {
  B3StoreContainer,
} from './components/B3StoreContainer'
import B3ThemeProvider from './theme'

import * as locales from './locales'
import {
  SUPPORT_LANGUAGE,
} from './constants'

import {
  createFrameLoading,
} from './utils/b3PageMask'

const CONTAINER_ID = 'bundle-container'

createFrameLoading()

let container = document.getElementById(CONTAINER_ID)
if (!container) {
  container = document.createElement('div')
  container.id = CONTAINER_ID
  document.body.appendChild(container)
}

container.className = 'bundle-namespace'

ReactDOM.createRoot(container).render(
  <GlobalProvider>
    <B3StoreContainer>
      <DynamicallyVariableProvider>
        <LangProvider
          locales={locales}
          supportLang={SUPPORT_LANGUAGE}
        >
          <B3ThemeProvider>
            <App />
          </B3ThemeProvider>
        </LangProvider>
      </DynamicallyVariableProvider>
    </B3StoreContainer>
  </GlobalProvider>
  ,
)
