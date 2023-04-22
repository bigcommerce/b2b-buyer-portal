import {
  bindLinks,
  initApp,
  requestIdleCallbackFunction,
  unbindLinks,
} from './load-functions'

// check if the accesed url contains a hashtag
if (window.location.hash.startsWith('#/')) {
  initApp()
} else {
  // load the app when the browser is free
  requestIdleCallbackFunction(initApp)
  // and bind links to load the app
  bindLinks()
  window.addEventListener('beforeunload', unbindLinks)
  // and observe global flag to simulate click
  window.b2bStorefrontApp.registerIsInitListener(() => {
    unbindLinks()
    setTimeout(() => window.b2bStorefrontApp.clickedLinkElement?.click(), 0)
  })
}
