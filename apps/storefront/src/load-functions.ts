import globalB3 from '@b3/global-b3'

export const requestIdleCallbackFunction: typeof window.requestIdleCallback = window.requestIdleCallback ? window.requestIdleCallback : (cb: IdleRequestCallback) => {
  const start = Date.now()
  return window.setTimeout(() => {
    cb({
      didTimeout: false,
      timeRemaining() {
        return Math.max(0, 50 - (Date.now() - start))
      },
    })
  }, 1)
}

window.b2bStorefrontApp = {
  /* init flag listener */
  __isInitVariable: false,
  __isInitListener: () => {},
  set __isInit(value: boolean) {
    this.__isInitVariable = value
    this.__isInitListener(value)
  },
  get __isInit() {
    return this.__isInitVariable
  },
  registerIsInitListener(listener: Function) {
    this.__isInitListener = listener
  },

  // helper variable to save clicked link
  clickedLinkElement: undefined,
}

export const initApp = async () => {
  if (window.b2bStorefrontApp.__isInit) return

  await import('./react-setup')
}

const clickLink = async (e: MouseEvent) => {
  window.b2bStorefrontApp.clickedLinkElement = e.target
  e.preventDefault()
  e.stopPropagation()
  await initApp()
}

export const bindLinks = () => {
  const links:NodeListOf<HTMLAnchorElement> = document.querySelectorAll(`${globalB3['dom.registerElement']}, ${globalB3['dom.allOtherElement']}`)

  links.forEach((accessLink) => accessLink.addEventListener('click', clickLink))
}
export const unbindLinks = () => {
  const links:NodeListOf<HTMLAnchorElement> = document.querySelectorAll(`${globalB3['dom.registerElement']}, ${globalB3['dom.allOtherElement']}`)

  links.forEach((accessLink) => accessLink.removeEventListener('click', clickLink))
}
