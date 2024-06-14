import { PropsWithChildren } from 'react';
import { Provider } from 'react-redux';
import { configureStore, ConfigureStoreOptions } from '@reduxjs/toolkit';
import { render, RenderOptions } from '@testing-library/react';

import { AppStore, middlewareOptions } from '@/store';

// This type interface extends the default options for render from RTL, as well
// as allows the user to specify other things such as initialState, store.
interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
  reducer: ConfigureStoreOptions['reducer'];
  preloadedState?: ConfigureStoreOptions['preloadedState'];
}

interface RenderWithProvidersResult {
  store: AppStore;
  result: ReturnType<typeof render>;
}

export const renderWithProviders = (
  ui: React.ReactElement,
  { reducer, preloadedState, ...renderOptions }: ExtendedRenderOptions,
): RenderWithProvidersResult => {
  const store = configureStore({
    reducer,
    preloadedState,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware(middlewareOptions),
  });

  const wrapper = ({ children }: PropsWithChildren) => {
    return <Provider store={store}>{children}</Provider>;
  };

  const result = render(ui, {
    wrapper,
    ...renderOptions,
  });

  return {
    store,
    result,
  };
};

export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
