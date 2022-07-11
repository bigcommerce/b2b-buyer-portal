import ReactDOM from 'react-dom/client'
import App from './App'

import './main.css'

const CONTAINER_ID = 'bundle-container'

let container = document.getElementById(CONTAINER_ID)
if (!container) {
  container = document.createElement('div')
  container.id = CONTAINER_ID
  document.body.appendChild(container)
}

container.className = 'bundle-namespace'

ReactDOM.createRoot(container).render(<App />)
