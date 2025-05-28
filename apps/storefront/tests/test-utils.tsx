import { ComponentProps, PropsWithChildren, Suspense, useContext, useEffect } from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { LangProvider } from '@b3/lang';
import { render, RenderOptions } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { Mock } from 'vitest';

import { GlobalContext, GlobalProvider } from '@/shared/global';
import { GlobalState } from '@/shared/global/context/config';
import { AppStore, RootState, setupStore } from '@/store';
import * as storeModule from '@/store';

interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
  initialGlobalContext?: Partial<GlobalState>;
  preloadedState?: Partial<RootState>;
  initialEntries?: ComponentProps<typeof MemoryRouter>['initialEntries'];
  store?: AppStore;
}

function NavigationSpy({ children, spy }: PropsWithChildren<{ spy: Mock<[string]> }>) {
  const location = useLocation();

  spy.mockReset();
  spy(`${location.pathname}${location.search}`);

  return <>{children}</>;
}

function MockGlobalProvider({ payload }: { payload: Partial<GlobalState> }) {
  const { dispatch } = useContext(GlobalContext);

  useEffect(() => {
    dispatch({ type: 'common', payload });
  }, [payload, dispatch]);

  return null;
}

export const renderWithProviders = (
  ui: React.ReactElement,
  extendedRenderOptions: Partial<ExtendedRenderOptions> = {},
) => {
  const {
    preloadedState = {},
    initialGlobalContext = {},
    initialEntries,
    store = setupStore(preloadedState),
    ...renderOptions
  } = extendedRenderOptions;

  vi.spyOn(storeModule, 'store', 'get').mockReturnValue(store);

  const navigation = vi.fn<[string]>();
  function Wrapper({ children }: PropsWithChildren) {
    return (
      <Suspense fallback="test-loading">
        <GlobalProvider>
          <MockGlobalProvider payload={initialGlobalContext} />
          <Provider store={store}>
            <LangProvider>
              <MemoryRouter initialEntries={initialEntries}>
                <NavigationSpy spy={navigation}>{children}</NavigationSpy>
              </MemoryRouter>
            </LangProvider>
          </Provider>
        </GlobalProvider>
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

export function stringContainingAll(...substrings: string[]) {
  return {
    asymmetricMatch(received: string) {
      return substrings.every((sub) => received.includes(sub));
    },
    toString() {
      return 'stringContainingAll';
    },
    getExpectedType() {
      return 'string';
    },
  };
}

export { startMockServer } from './mockServer';
export { graphql, http, HttpResponse } from 'msw';
export { assertQueryParams } from './assertQueryParams';
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

export { builder, bulk } from 'tests/builder';
export * from 'tests/storeStateBuilders';
export { faker } from '@faker-js/faker';
export { getUnixTime } from 'date-fns';
