import { PropsWithChildren, Suspense } from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { LangProvider } from '@b3/lang';
import { render, RenderOptions } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { Mock } from 'vitest';

import { AppStore, RootState, setupStore } from '@/store';

interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
  preloadedState?: Partial<RootState>;
  store?: AppStore;
}

function NavigationSpy({ children, spy }: PropsWithChildren<{ spy: Mock<[string]> }>) {
  const location = useLocation();

  spy.mockReset();
  spy(`${location.pathname}${location.search}`);

  return <>{children}</>;
}

export const renderWithProviders = (
  ui: React.ReactElement,
  extendedRenderOptions: Partial<ExtendedRenderOptions> = {},
) => {
  const {
    preloadedState = {},
    store = setupStore(preloadedState),
    ...renderOptions
  } = extendedRenderOptions;

  const navigation = vi.fn<[string]>();

  function Wrapper({ children }: PropsWithChildren) {
    return (
      <Suspense fallback="test-loading">
        <Provider store={store}>
          <LangProvider>
            <MemoryRouter>
              <NavigationSpy spy={navigation}>{children}</NavigationSpy>
            </MemoryRouter>
          </LangProvider>
        </Provider>
      </Suspense>
    );
  }

  return {
    user: userEvent.setup(),
    store,
    navigation,
    result: render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
};

export { startMockServer } from './mockServer';
export { http, HttpResponse } from 'msw';
export { assertQueryParams } from './assertQueryParams';
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

export { builder, bulk } from 'tests/builder';
export { buildCompanyStateWith } from 'tests/storeStateBuilders';
