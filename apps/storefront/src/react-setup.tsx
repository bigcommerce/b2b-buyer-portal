import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'

import { CustomStyleProvider } from '@/shared/customStyleButtton'
import { DynamicallyVariableProvider } from '@/shared/dynamicallyVariable'
import { GlobalProvider } from '@/shared/global'

import B3StoreContainer from './components/B3StoreContainer'
import App from './App'
import { LangWrapper } from './lang'
import { persistor, store } from './store'
import B3ThemeProvider from './theme'

import './main.css'

const CONTAINER_ID = 'bundle-container'

let container = document.getElementById(CONTAINER_ID)
if (!container) {
  container = document.createElement('div')
  container.id = CONTAINER_ID
  document.body.appendChild(container)
}

container.className = 'bundle-namespace'

ReactDOM.createRoot(container).render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <GlobalProvider>
        <CustomStyleProvider>
          <LangWrapper>
            <B3StoreContainer>
              <DynamicallyVariableProvider>
                <B3ThemeProvider>
                  <App />
                </B3ThemeProvider>
              </DynamicallyVariableProvider>
            </B3StoreContainer>
          </LangWrapper>
        </CustomStyleProvider>
      </GlobalProvider>
    </PersistGate>
  </Provider>
)
