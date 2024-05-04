import { PropsWithChildren } from 'react'
import { Provider } from 'react-redux'
import { configureStore, ConfigureStoreOptions } from '@reduxjs/toolkit'
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
// This type interface extends the default options for render from RTL, as well
// as allows the user to specify other things such as initialState, store.
interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
  reducer: ConfigureStoreOptions['reducer']
  preloadedState?: ConfigureStoreOptions['preloadedState']
}

export const renderWithProviders = (
  ui: React.ReactElement,
  { reducer, preloadedState, ...renderOptions }: ExtendedRenderOptions
) => {
  const store = configureStore({
    reducer,
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware(middlewareOptions),
  })

  function Wrapper({ children }: PropsWithChildren) {
    return <Provider store={store}>{children}</Provider>
  }
  return {
    store,
    result: {
      ...render(ui, {
        wrapper: Wrapper,
        ...renderOptions,
      }),
    },
  }
}

export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'
// override render export
export { customRender as render }
