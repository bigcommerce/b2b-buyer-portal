import { beforeEach, describe, expect, it, vi } from 'vitest';

const fetchMock = vi.hoisted(() => vi.fn());

vi.mock('./fetch', () => ({
  default: fetchMock,
}));

vi.mock('@/store', () => ({
  store: {
    getState: () => ({
      company: {
        tokens: {
          B2BToken: 'b2b-token',
          bcGraphqlToken: 'bc-token',
        },
      },
    }),
  },
}));

vi.mock('@/utils/b3Tip', () => ({
  snackbar: { error: vi.fn() },
}));

vi.mock('@/utils/basicConfig', () => ({
  BigCommerceStorefrontAPIBaseURL: '/bigcommerce',
  channelId: '1',
  storeHash: 'abc123',
}));

vi.mock('@/utils/logoutSession', () => ({
  logoutSession: vi.fn(),
}));

describe('B3Request graphql mock routing', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  async function loadRequestModule() {
    const { default: B3Request } = await import('./b3Fetch');

    return B3Request;
  }

  it('routes registered BC proxy operations through the mock layer in dev mock mode', async () => {
    vi.stubEnv('DEV', true);
    vi.stubEnv('VITE_USE_MOCK_API', 'true');

    const B3Request = await loadRequestModule();

    const result = await B3Request.graphqlBCProxy({
      query:
        'query GetCustomerOrders { customer { orders(first: 1) { edges { node { entityId } } } } }',
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      data: {
        customer: {
          orders: {
            edges: expect.any(Array),
          },
        },
      },
    });
  });

  it('passes unregistered operations through to the low-level fetch layer in dev mock mode', async () => {
    vi.stubEnv('DEV', true);
    vi.stubEnv('VITE_USE_MOCK_API', 'true');
    fetchMock.mockResolvedValue({
      data: {
        site: {
          order: {
            entityId: 'order-1',
          },
        },
      },
    });

    const B3Request = await loadRequestModule();

    const result = await B3Request.graphqlBCProxy({
      query: 'query GetOrderDetail { site { order { entityId } } }',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      data: {
        site: {
          order: {
            entityId: 'order-1',
          },
        },
      },
    });
  });

  it('calls the low-level fetch layer when mock mode is disabled', async () => {
    vi.stubEnv('DEV', false);
    vi.stubEnv('VITE_USE_MOCK_API', 'true');
    fetchMock.mockResolvedValue({
      data: {
        customer: {
          orders: {
            edges: [],
          },
        },
      },
    });

    const B3Request = await loadRequestModule();

    const result = await B3Request.graphqlBCProxy({
      query:
        'query GetCustomerOrders { customer { orders(first: 1) { edges { node { entityId } } } } }',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      data: {
        customer: {
          orders: {
            edges: [],
          },
        },
      },
    });
  });

  it('keeps B2B GraphQL data unwrapped when mock mode falls through', async () => {
    vi.stubEnv('DEV', true);
    vi.stubEnv('VITE_USE_MOCK_API', 'true');
    fetchMock.mockResolvedValue({
      data: {
        customer: {
          id: 'customer-1',
        },
      },
    });

    const B3Request = await loadRequestModule();

    const result = await B3Request.graphqlB2B({
      query: 'query GetCustomerProfile { customer { id } }',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      customer: {
        id: 'customer-1',
      },
    });
  });
});
