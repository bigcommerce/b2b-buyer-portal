import { set } from 'lodash-es';
import {
  buildB2BFeaturesStateWith,
  buildCompanyStateWith,
  faker,
  graphql,
  HttpResponse,
  startMockServer,
  waitFor,
} from 'tests/test-utils';
import { renderHookWithProviders } from 'tests/utils/hook-test-utils';

import { CustomerRole } from '@/types';
import b2bLogger from '@/utils/b3Logger';

import { useLogout } from './useLogout';

vi.mock('@/utils/b3Logger');

const { server } = startMockServer();

const bcGraphql = graphql.link(`${window.location.origin}/graphql`);
const b2bGraphql = graphql.link('https://api-b2b.bigcommerce.com/graphql');

describe('useLogout', () => {
  it('fetches a fresh anonymous storefront token after clearing the session', async () => {
    const freshToken = faker.string.uuid();

    server.use(
      bcGraphql.mutation('Logout', () =>
        HttpResponse.json({ data: { logout: { result: 'success' } } }),
      ),
      b2bGraphql.mutation('storeFrontToken', () =>
        HttpResponse.json({ data: { storeFrontToken: { token: freshToken } } }),
      ),
    );

    const { result, store } = renderHookWithProviders(() => useLogout(), {
      preloadedState: {
        company: buildCompanyStateWith({
          customer: { role: CustomerRole.ADMIN },
          tokens: {
            B2BToken: faker.string.uuid(),
            bcGraphqlToken: faker.string.uuid(),
            currentCustomerJWT: faker.string.uuid(),
          },
        }),
        b2bFeatures: buildB2BFeaturesStateWith({
          masqueradeCompany: { isAgenting: false },
        }),
      },
    });

    result.result.current({ showLogoutBanner: false });

    await waitFor(() => {
      expect(store.getState().company.tokens.bcGraphqlToken).toBe(freshToken);
    });
  });

  it('still dispatches the on-logout event when storeFrontToken fails', async () => {
    set(window, 'b2b.callbacks.dispatchEvent', vi.fn().mockReturnValue(true));

    server.use(
      bcGraphql.mutation('Logout', () =>
        HttpResponse.json({ data: { logout: { result: 'success' } } }),
      ),
      b2bGraphql.mutation('storeFrontToken', () => HttpResponse.error()),
    );

    const { result } = renderHookWithProviders(() => useLogout(), {
      preloadedState: {
        company: buildCompanyStateWith({
          customer: { role: CustomerRole.ADMIN },
          tokens: {
            B2BToken: faker.string.uuid(),
            bcGraphqlToken: faker.string.uuid(),
            currentCustomerJWT: faker.string.uuid(),
          },
        }),
        b2bFeatures: buildB2BFeaturesStateWith({
          masqueradeCompany: { isAgenting: false },
        }),
      },
    });

    result.result.current({ showLogoutBanner: true });

    await waitFor(() => {
      expect(window.b2b.callbacks.dispatchEvent).toHaveBeenCalledWith('on-logout', undefined);
    });
    expect(b2bLogger.error).toHaveBeenCalled();
  });
});
