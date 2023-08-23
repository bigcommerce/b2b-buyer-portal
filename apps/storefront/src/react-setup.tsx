import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { LangProvider } from '@b3/lang'

import { CustomStyleProvider } from '@/shared/customStyleButtton'
import { DynamicallyVariableProvider } from '@/shared/dynamicallyVariable'
import { GlobalProvider } from '@/shared/global'

import B3StoreContainer from './components/B3StoreContainer'
import { createFrameLoading } from './utils/b3PageMask'
import App from './App'
import { store } from './store'
import B3ThemeProvider from './theme'

import './main.css'

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
  <Provider store={store}>
    <GlobalProvider>
      <CustomStyleProvider>
        <B3StoreContainer>
          <DynamicallyVariableProvider>
            <LangProvider>
              <B3ThemeProvider>
                <App />
              </B3ThemeProvider>
            </LangProvider>
          </DynamicallyVariableProvider>
        </B3StoreContainer>
      </CustomStyleProvider>
    </GlobalProvider>
  </Provider>
)
