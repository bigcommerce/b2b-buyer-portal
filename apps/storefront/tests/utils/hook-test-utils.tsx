import { ComponentProps, PropsWithChildren, Suspense, useContext, useEffect } from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { renderHook, RenderHookOptions } from '@testing-library/react';
import { Mock } from 'vitest';

import B3LayoutTip from '@/components/layout/B3LayoutTip';
import LangProvider from '@/lib/lang/LangProvider';
import { DynamicallyVariableProvider } from '@/shared/dynamicallyVariable';
import { GlobalContext, GlobalProvider } from '@/shared/global';
import { GlobalState } from '@/shared/global/context/config';
import { AppStore, RootState, setupStore } from '@/store';
import * as storeModule from '@/store';

interface ExtendedRenderHookOptions<Result> extends Omit<RenderHookOptions<Result>, 'queries'> {
  initialGlobalContext?: Partial<GlobalState>;
  preloadedState?: Partial<RootState>;
  initialEntries?: ComponentProps<typeof MemoryRouter>['initialEntries'];
  store?: AppStore;
}

function NavigationSpy({ children, spy }: PropsWithChildren<{ spy: Mock }>) {
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

export const renderHookWithProviders = <Result, Props>(
  hook: (initialProps: Props) => Result,
  options: Partial<ExtendedRenderHookOptions<Props>> = {},
) => {
  const {
    preloadedState = {},
    initialGlobalContext = {},
    initialEntries,
    store = setupStore(preloadedState),
    ...renderOptions
  } = options;

  vi.spyOn(storeModule, 'store', 'get').mockReturnValue(store);
  const navigation = vi.fn();

  function Wrapper({ children }: PropsWithChildren) {
    return (
      <Suspense fallback="test-loading">
        <GlobalProvider>
          <MockGlobalProvider payload={initialGlobalContext} />
          <Provider store={store}>
            <LangProvider>
              <DynamicallyVariableProvider>
                <B3LayoutTip />
                <MemoryRouter initialEntries={initialEntries}>
                  <NavigationSpy spy={navigation}>{children}</NavigationSpy>
                </MemoryRouter>
              </DynamicallyVariableProvider>
            </LangProvider>
          </Provider>
        </GlobalProvider>
      </Suspense>
    );
  }

  return {
    store,
    navigation,
    result: renderHook<Result, Props>(hook, { wrapper: Wrapper, ...renderOptions }),
  };
};
