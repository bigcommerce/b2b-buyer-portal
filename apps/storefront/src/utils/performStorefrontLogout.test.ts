import { faker, graphql, HttpResponse, startMockServer, waitFor } from 'tests/test-utils';

import { store } from '@/store';
import { clearCompanySlice, setB2BToken, setBcGraphQLToken } from '@/store/slices/company';
import b2bLogger from '@/utils/b3Logger';

import { performStorefrontLogout } from './performStorefrontLogout';

vi.mock('@/utils/b3Logger');

const { server } = startMockServer();

const bcGraphql = graphql.link(`${window.location.origin}/graphql`);
const b2bGraphql = graphql.link('https://api-b2b.bigcommerce.com/graphql');

const bcLogoutSucceeds = () =>
  bcGraphql.mutation('Logout', () =>
    HttpResponse.json({ data: { logout: { result: 'success' } } }),
  );

const freshStorefrontToken = (token: string) =>
  b2bGraphql.mutation('storeFrontToken', () =>
    HttpResponse.json({ data: { storeFrontToken: { token } } }),
  );

describe('performStorefrontLogout', () => {
  beforeEach(() => {
    store.dispatch(clearCompanySlice());
    store.dispatch(setBcGraphQLToken(faker.string.uuid()));
  });

  it('revokes the B2B token with the token still attached, before clearing the session', async () => {
    const b2bToken = faker.string.uuid();
    const b2bLogoutRequests: string[] = [];
    store.dispatch(setB2BToken(b2bToken));

    server.use(
      b2bGraphql.mutation('B2BLogout', ({ request }) => {
        b2bLogoutRequests.push(request.headers.get('Authorization') ?? '');
        return HttpResponse.json({ data: { logout: { message: 'Success' } } });
      }),
      bcLogoutSucceeds(),
      freshStorefrontToken(faker.string.uuid()),
    );

    const afterSuccess = vi.fn().mockResolvedValue(undefined);
    await performStorefrontLogout(afterSuccess);

    expect(b2bLogoutRequests).toEqual([`Bearer  ${b2bToken}`]);
    expect(afterSuccess).toHaveBeenCalledOnce();
    expect(store.getState().company.tokens.B2BToken).toBe('');
  });

  it('skips the B2B logout when no B2B token is held', async () => {
    let b2bLogoutCalls = 0;

    server.use(
      b2bGraphql.mutation('B2BLogout', () => {
        b2bLogoutCalls += 1;
        return HttpResponse.json({ data: { logout: { message: 'Success' } } });
      }),
      bcLogoutSucceeds(),
      freshStorefrontToken(faker.string.uuid()),
    );

    await performStorefrontLogout();

    expect(b2bLogoutCalls).toBe(0);
  });

  it('still logs out of BC and clears the session when the B2B logout fails', async () => {
    store.dispatch(setB2BToken(faker.string.uuid()));
    const freshToken = faker.string.uuid();

    server.use(
      b2bGraphql.mutation('B2BLogout', () => HttpResponse.error()),
      bcLogoutSucceeds(),
      freshStorefrontToken(freshToken),
    );

    const afterSuccess = vi.fn().mockResolvedValue(undefined);
    await performStorefrontLogout(afterSuccess);

    expect(b2bLogger.error).toHaveBeenCalled();
    expect(afterSuccess).toHaveBeenCalledOnce();
    expect(store.getState().company.tokens.B2BToken).toBe('');
    await waitFor(() => {
      expect(store.getState().company.tokens.bcGraphqlToken).toBe(freshToken);
    });
  });
});
