import { PropsWithChildren } from 'react'
import { Provider } from 'react-redux'
import { setupStore } from '@b3/store'
import { cleanup, render, RenderOptions } from '@testing-library/react'
import { afterEach } from 'vitest'

import { middlewareOptions } from '@/store'

afterEach(() => {
  cleanup()
})

const customRender = (ui: React.ReactElement, options = {}) =>
  render(ui, {
    // wrap provider(s) here if needed
    wrapper: ({ children }) => children,
    ...options,
  })
type SetupStoreParams = Parameters<typeof setupStore>[0]
// This type interface extends the default options for render from RTL, as well
// as allows the user to specify other things such as initialState, store.
interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
  reducers: SetupStoreParams['reducers']
  preloadedState?: SetupStoreParams['preloadedState']
}

export const renderWithProviders = (
  ui: React.ReactElement,
  { reducers, preloadedState, ...renderOptions }: ExtendedRenderOptions
) => {
  const store = setupStore({
    reducers,
    preloadedState,
    middlewareOptions,
  })

  function Wrapper({ children }: PropsWithChildren) {
    return <Provider store={store}>{children}</Provider>
  }
  return {
    store,
    ...render(ui, {
      wrapper: Wrapper,
      ...renderOptions,
    }),
  }
}

export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'
// override render export
export { customRender as render }
