import { getStorefrontLanguageCode } from '@/lib/lang/getStorefrontLanguageCode';
import { store } from '@/store';

import B3Request from './b3Fetch';
import b3Fetch from './fetch';

vi.mock('@/lib/lang/getStorefrontLanguageCode', () => ({
  getStorefrontLanguageCode: vi.fn(),
}));

vi.mock('./fetch', () => ({ default: vi.fn() }));

describe('graphqlBCProxy', () => {
  beforeEach(() => {
    vi.spyOn(store, 'getState').mockReturnValue({
      company: { tokens: { B2BToken: 'b2b-token' } },
    } as unknown as ReturnType<typeof store.getState>);
    vi.mocked(getStorefrontLanguageCode).mockReturnValue('fr-CA');
    vi.mocked(b3Fetch).mockResolvedValue({});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('forwards the active locale to the Storefront GraphQL proxy', async () => {
    await B3Request.graphqlBCProxy({ query: 'query Test { site { name } }' });

    expect(b3Fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v3/proxy/bc-storefront/graphql'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer  b2b-token',
          'Accept-Language': 'fr-CA',
        }),
      }),
    );
  });
});
