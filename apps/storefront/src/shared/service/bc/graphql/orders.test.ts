import { builder, faker } from 'tests/test-utils';

import type {
  CompanyOrdersConnection,
  GetCompanyOrdersResponse,
  GetCustomerOrdersResponse,
  GetCustomersWithOrdersResponse,
  GetOrderDetailResponse,
  Order,
  OrderPlacedBy,
} from './orders';
import {
  getCompanyOrders,
  getCustomerOrders,
  getCustomersWithOrders,
  getOrderDetail,
  OrdersSortInput,
} from './orders';

vi.mock('../../request/b3Fetch', () => ({
  default: {
    graphqlBC: vi.fn(),
    graphqlBCProxy: vi.fn(),
  },
}));

const getB3Request = async () => {
  const mod = await import('../../request/b3Fetch');
  return mod.default;
};

// ---------------------------------------------------------------------------
// Test data builders
// ---------------------------------------------------------------------------

const buildMoneyWith = builder(() => ({
  currencyCode: 'USD',
  value: faker.number.float({ min: 1, max: 500, fractionDigits: 2 }),
}));

const buildPlacedByWith = builder<OrderPlacedBy>(() => ({
  entityId: faker.number.int({ min: 1, max: 9999 }),
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  email: faker.internet.email(),
}));

const buildPageInfoWith = builder(() => ({
  hasNextPage: false,
  hasPreviousPage: false,
  startCursor: faker.string.alphanumeric(20),
  endCursor: faker.string.alphanumeric(20),
}));

const buildB2BOrderWith = builder<Order>(() => ({
  entityId: faker.number.int({ min: 1000, max: 99999 }),
  orderedAt: { utc: faker.date.past().toISOString() },
  updatedAt: { utc: faker.date.past().toISOString() },
  status: { value: 'PENDING', label: 'Pending' },
  billingAddress: {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    company: faker.company.name(),
    address1: faker.location.streetAddress(),
    address2: null,
    city: faker.location.city(),
    stateOrProvince: faker.location.state(),
    postalCode: faker.location.zipCode(),
    country: faker.location.country(),
    countryCode: faker.location.countryCode(),
    phone: faker.phone.number(),
    email: faker.internet.email(),
  },
  subTotal: buildMoneyWith('WHATEVER_VALUES'),
  discountedSubTotal: null,
  shippingCostTotal: buildMoneyWith({ value: 9.99 }),
  handlingCostTotal: buildMoneyWith({ value: 0 }),
  wrappingCostTotal: buildMoneyWith({ value: 0 }),
  taxTotal: buildMoneyWith({ value: 5.0 }),
  totalIncTax: buildMoneyWith('WHATEVER_VALUES'),
  isTaxIncluded: false,
  taxes: [{ name: 'Tax', amount: buildMoneyWith({ value: 5.0 }) }],
  discounts: {
    couponDiscounts: [],
    nonCouponDiscountTotal: buildMoneyWith({ value: 0 }),
    totalDiscount: null,
  },
  customerMessage: null,
  totalProductQuantity: faker.number.int({ min: 1, max: 20 }),
  consignments: null,
  reference: faker.string.alphanumeric(8),
  company: { entityId: faker.number.int({ min: 1, max: 999 }), name: faker.company.name() },
  placedBy: buildPlacedByWith('WHATEVER_VALUES'),
  history: [],
  quote: null,
  invoice: null,
  extraFields: [],
}));

const buildB2COrderWith = builder<Order>(() => ({
  ...buildB2BOrderWith('WHATEVER_VALUES'),
  reference: null,
  company: null,
  placedBy: null,
  history: [],
  quote: null,
  invoice: null,
  extraFields: [],
}));

const buildGetCustomerOrdersResponseWith = builder<GetCustomerOrdersResponse>(() => ({
  data: {
    customer: {
      orders: {
        edges: [
          { node: buildB2BOrderWith('WHATEVER_VALUES'), cursor: faker.string.alphanumeric(20) },
        ],
        pageInfo: buildPageInfoWith('WHATEVER_VALUES'),
      },
    },
  },
}));

const buildGetCustomerOrdersB2CResponseWith = builder<GetCustomerOrdersResponse>(() => ({
  data: {
    customer: {
      orders: {
        edges: [
          { node: buildB2COrderWith('WHATEVER_VALUES'), cursor: faker.string.alphanumeric(20) },
        ],
        pageInfo: buildPageInfoWith('WHATEVER_VALUES'),
      },
    },
  },
}));

const buildGetCompanyOrdersResponseWith = builder<GetCompanyOrdersResponse>(() => ({
  data: {
    customer: {
      company: {
        orders: {
          edges: [
            {
              node: buildB2BOrderWith('WHATEVER_VALUES'),
              cursor: faker.string.alphanumeric(20),
            },
          ],
          pageInfo: buildPageInfoWith('WHATEVER_VALUES'),
          collectionInfo: { totalItems: 1 },
        } satisfies CompanyOrdersConnection,
      },
    },
  },
}));

const buildGetOrderDetailResponseWith = builder<GetOrderDetailResponse>(() => ({
  data: { site: { order: buildB2BOrderWith('WHATEVER_VALUES') } },
}));

const buildGetOrderDetailB2CResponseWith = builder<GetOrderDetailResponse>(() => ({
  data: { site: { order: buildB2COrderWith('WHATEVER_VALUES') } },
}));

const buildGetCustomersWithOrdersResponseWith = builder<GetCustomersWithOrdersResponse>(() => ({
  data: {
    customer: {
      company: {
        customersWithOrders: {
          edges: [
            { node: buildPlacedByWith('WHATEVER_VALUES'), cursor: faker.string.alphanumeric(20) },
          ],
          pageInfo: buildPageInfoWith('WHATEVER_VALUES'),
        },
      },
    },
  },
}));

const buildGraphQLErrorResponseWith = builder(() => ({
  errors: [{ message: 'Something went wrong' }],
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

/**
 * Client path decision:
 *
 * The `graphqlRequest<T>()` helper in orders.ts branches on `platform`:
 * - platform === 'bigcommerce' → B3Request.graphqlBC (stencil stores)
 * - platform !== 'bigcommerce' → B3Request.graphqlBCProxy (headless / custom)
 *
 * This matches the established pattern in company.ts (registerCompany).
 * Both clients talk to the BC Storefront GraphQL API. The proxy path
 * (graphqlBCProxy) forwards to SF GQL via the B2B API proxy and
 * authenticates with the B2B token. The direct path (graphqlBC) uses
 * a storefront customer token.
 *
 * The B2B extension layer (gRPC enrichment) is transparent to the
 * client — SF GQL handles the fan-out server-side.
 */

describe('orders service functions', () => {
  describe('platform === "bigcommerce" (stencil — uses graphqlBC)', () => {
    describe('getCustomerOrders', () => {
      it('calls graphqlBC with the correct query and variables', async () => {
        const B3Request = await getB3Request();
        const response = buildGetCustomerOrdersResponseWith('WHATEVER_VALUES');
        vi.mocked(B3Request.graphqlBC).mockResolvedValue(response);

        const variables = { filters: { status: 'PENDING' }, first: 10 };
        const result = await getCustomerOrders(variables);

        expect(B3Request.graphqlBC).toHaveBeenCalledWith({
          query: expect.stringContaining('query GetCustomerOrders'),
          variables,
        });
        expect(result).toBe(response);
      });

      it('returns B2B-enriched order data', async () => {
        const B3Request = await getB3Request();
        const response = buildGetCustomerOrdersResponseWith('WHATEVER_VALUES');
        vi.mocked(B3Request.graphqlBC).mockResolvedValue(response);

        const result = await getCustomerOrders({ first: 10 });
        const order = result.data?.customer?.orders?.edges[0]?.node;

        expect(order?.reference).toEqual(expect.any(String));
        expect(order?.company).toEqual(
          expect.objectContaining({ entityId: expect.any(Number), name: expect.any(String) }),
        );
        expect(order?.placedBy).toEqual(
          expect.objectContaining({ entityId: expect.any(Number), firstName: expect.any(String) }),
        );
        expect(order?.history).toEqual(expect.any(Array));
        expect(order?.extraFields).toEqual(expect.any(Array));
        expect(order?.invoice).toBeNull();
      });

      it('returns null B2B fields for B2C orders', async () => {
        const B3Request = await getB3Request();
        const response = buildGetCustomerOrdersB2CResponseWith('WHATEVER_VALUES');
        vi.mocked(B3Request.graphqlBC).mockResolvedValue(response);

        const result = await getCustomerOrders({ first: 10 });
        const order = result.data?.customer?.orders?.edges[0]?.node;

        expect(order?.reference).toBeNull();
        expect(order?.company).toBeNull();
        expect(order?.placedBy).toBeNull();
        expect(order?.quote).toBeNull();
        expect(order?.invoice).toBeNull();
        expect(order?.extraFields).toEqual([]);
      });

      it('propagates errors from the client', async () => {
        const B3Request = await getB3Request();
        vi.mocked(B3Request.graphqlBC).mockRejectedValue(new Error('Network error'));

        await expect(getCustomerOrders({ first: 10 })).rejects.toThrow('Network error');
      });

      it('returns GraphQL-level errors in the response', async () => {
        const B3Request = await getB3Request();
        const errorResponse = buildGraphQLErrorResponseWith('WHATEVER_VALUES');
        vi.mocked(B3Request.graphqlBC).mockResolvedValue(errorResponse);

        const result = await getCustomerOrders({ first: 10 });

        expect(result.errors).toBeDefined();
        expect(result.errors?.[0]?.message).toBe('Something went wrong');
      });
    });

    describe('getCompanyOrders', () => {
      it('calls graphqlBC with the correct query and variables', async () => {
        const B3Request = await getB3Request();
        const response = buildGetCompanyOrdersResponseWith('WHATEVER_VALUES');
        vi.mocked(B3Request.graphqlBC).mockResolvedValue(response);

        const variables = {
          filters: { search: 'test', status: ['PENDING'] },
          sortBy: OrdersSortInput.CREATED_AT_NEWEST,
          first: 20,
        };
        const result = await getCompanyOrders(variables);

        expect(B3Request.graphqlBC).toHaveBeenCalledWith({
          query: expect.stringContaining('query GetCompanyOrders'),
          variables,
        });
        expect(result.data?.customer?.company?.orders?.collectionInfo?.totalItems).toEqual(
          expect.any(Number),
        );
      });

      it('includes collectionInfo in the response', async () => {
        const B3Request = await getB3Request();
        const response = buildGetCompanyOrdersResponseWith('WHATEVER_VALUES');
        vi.mocked(B3Request.graphqlBC).mockResolvedValue(response);

        const result = await getCompanyOrders({ first: 10 });
        const connection = result.data?.customer?.company?.orders;

        expect(connection?.collectionInfo).toBeDefined();
        expect(connection?.pageInfo).toBeDefined();
        expect(connection?.edges).toEqual(expect.any(Array));
      });
    });

    describe('getOrderDetail', () => {
      it('calls graphqlBC with entityId variable', async () => {
        const B3Request = await getB3Request();
        const response = buildGetOrderDetailResponseWith('WHATEVER_VALUES');
        vi.mocked(B3Request.graphqlBC).mockResolvedValue(response);

        const variables = { entityId: 12345 };
        const result = await getOrderDetail(variables);

        expect(B3Request.graphqlBC).toHaveBeenCalledWith({
          query: expect.stringContaining('query GetOrderDetail'),
          variables,
        });
        expect(result.data?.site?.order?.entityId).toEqual(expect.any(Number));
      });

      it('returns B2B-enriched detail data', async () => {
        const B3Request = await getB3Request();
        const response = buildGetOrderDetailResponseWith('WHATEVER_VALUES');
        vi.mocked(B3Request.graphqlBC).mockResolvedValue(response);

        const result = await getOrderDetail({ entityId: 1 });
        const order = result.data?.site?.order;

        expect(order?.reference).toEqual(expect.any(String));
        expect(order?.company).toBeDefined();
        expect(order?.placedBy).toBeDefined();
        expect(order?.history).toEqual(expect.any(Array));
        expect(order?.extraFields).toEqual(expect.any(Array));
        expect(order?.status.label).toEqual(expect.any(String));
        expect(order?.totalIncTax.currencyCode).toEqual(expect.any(String));
        expect(order?.totalIncTax.value).toEqual(expect.any(Number));
        expect(order?.orderedAt.utc).toEqual(expect.any(String));
      });

      it('returns null B2B fields for B2C order detail', async () => {
        const B3Request = await getB3Request();
        const response = buildGetOrderDetailB2CResponseWith('WHATEVER_VALUES');
        vi.mocked(B3Request.graphqlBC).mockResolvedValue(response);

        const result = await getOrderDetail({ entityId: 1 });
        const order = result.data?.site?.order;

        expect(order?.reference).toBeNull();
        expect(order?.company).toBeNull();
        expect(order?.placedBy).toBeNull();
      });
    });

    describe('getCustomersWithOrders', () => {
      it('calls graphqlBC with the correct query and variables', async () => {
        const B3Request = await getB3Request();
        const response = buildGetCustomersWithOrdersResponseWith('WHATEVER_VALUES');
        vi.mocked(B3Request.graphqlBC).mockResolvedValue(response);

        const variables = { first: 50 };
        const result = await getCustomersWithOrders(variables);

        expect(B3Request.graphqlBC).toHaveBeenCalledWith({
          query: expect.stringContaining('query GetCustomersWithOrders'),
          variables,
        });

        const customer = result.data?.customer?.company?.customersWithOrders?.edges[0]?.node;
        expect(customer?.entityId).toEqual(expect.any(Number));
        expect(customer?.firstName).toEqual(expect.any(String));
        expect(customer?.lastName).toEqual(expect.any(String));
        expect(customer?.email).toEqual(expect.any(String));
      });
    });
  });

  describe('platform !== "bigcommerce" (headless — uses graphqlBCProxy)', () => {
    beforeEach(() => {
      window.B3 = {
        ...window.B3,
        setting: {
          ...window.B3.setting,
          platform: 'custom',
        },
      };
    });

    it('getCustomerOrders routes through graphqlBCProxy', async () => {
      vi.resetModules();
      const { getCustomerOrders: fn } = await import('./orders');
      const { default: B3Req } = await import('../../request/b3Fetch');

      vi.mocked(B3Req.graphqlBCProxy).mockResolvedValue(
        buildGetCustomerOrdersResponseWith('WHATEVER_VALUES'),
      );

      await fn({ first: 10 });

      expect(B3Req.graphqlBCProxy).toHaveBeenCalledWith({
        query: expect.stringContaining('query GetCustomerOrders'),
        variables: { first: 10 },
      });
    });

    it('getCompanyOrders routes through graphqlBCProxy', async () => {
      vi.resetModules();
      const { getCompanyOrders: fn } = await import('./orders');
      const { default: B3Req } = await import('../../request/b3Fetch');

      vi.mocked(B3Req.graphqlBCProxy).mockResolvedValue(
        buildGetCompanyOrdersResponseWith('WHATEVER_VALUES'),
      );

      await fn({ first: 10 });

      expect(B3Req.graphqlBCProxy).toHaveBeenCalledWith(
        expect.objectContaining({ query: expect.stringContaining('query GetCompanyOrders') }),
      );
    });

    it('getOrderDetail routes through graphqlBCProxy', async () => {
      vi.resetModules();
      const { getOrderDetail: fn } = await import('./orders');
      const { default: B3Req } = await import('../../request/b3Fetch');

      vi.mocked(B3Req.graphqlBCProxy).mockResolvedValue(
        buildGetOrderDetailResponseWith('WHATEVER_VALUES'),
      );

      await fn({ entityId: 123 });

      expect(B3Req.graphqlBCProxy).toHaveBeenCalledWith(
        expect.objectContaining({ query: expect.stringContaining('query GetOrderDetail') }),
      );
    });

    it('getCustomersWithOrders routes through graphqlBCProxy', async () => {
      vi.resetModules();
      const { getCustomersWithOrders: fn } = await import('./orders');
      const { default: B3Req } = await import('../../request/b3Fetch');

      vi.mocked(B3Req.graphqlBCProxy).mockResolvedValue(
        buildGetCustomersWithOrdersResponseWith('WHATEVER_VALUES'),
      );

      await fn({ first: 10 });

      expect(B3Req.graphqlBCProxy).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.stringContaining('query GetCustomersWithOrders'),
        }),
      );
    });
  });
});
