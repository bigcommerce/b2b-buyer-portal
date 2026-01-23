import { buildCompanyStateWith, renderWithProviders } from 'tests/test-utils';

import { setGlobalCommonState,store as globalStore } from '.';

describe('ensure store is restarted on every test', () => {
  it('should not share state between tests', () => {
    globalStore.dispatch(setGlobalCommonState({ cartNumber: 123 }));
    expect(globalStore.getState().global.cartNumber).toBe(123);
  });

  it('should not share state between tests', () => {
    expect(globalStore.getState().global.cartNumber).toBe(0);
  });
});

it('using preloadedState should seed the global store', () => {
  const { store } = renderWithProviders(<div />, {
    preloadedState: {
      company: buildCompanyStateWith({
        tokens: {
          currentCustomerJWT: 'foo',
        },
      }),
    },
  });

  expect(globalStore.getState().company.tokens.currentCustomerJWT).toBe('foo');
  expect(globalStore).toBe(store);
});
