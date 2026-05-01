import {
  buildCompanyStateWith,
  buildGlobalStateWith,
  faker,
  graphql,
  HttpResponse,
  renderWithProviders,
  screen,
  startMockServer,
  userEvent,
  waitFor,
  within,
} from 'tests/test-utils';

import { OrdersSortInput } from '@/shared/service/bc/graphql/orders';
import { CompanyStatus, CustomerRole, UserTypes } from '@/types';

import { DetailPagination } from './DetailPagination';

const { server } = startMockServer();

// Minimal unified GetCustomerOrders response (SF GQL)
function buildCustomerOrdersResponse(entityIds: number[]) {
  return {
    data: {
      customer: {
        orders: {
          edges: entityIds.map((entityId) => ({
            cursor: faker.string.alphanumeric(8),
            node: { entityId },
          })),
          pageInfo: { hasNextPage: false, hasPreviousPage: false },
        },
      },
    },
  };
}

// Minimal legacy BC GetCustomerOrders response
function buildBCOrdersLegacyResponse(orderIds: string[]) {
  return {
    data: {
      customerOrders: {
        totalCount: orderIds.length,
        pageInfo: { hasNextPage: false, hasPreviousPage: false },
        edges: orderIds.map((orderId) => ({ node: { orderId } })),
      },
    },
  };
}

// Minimal legacy B2B getAllOrders response
function buildAllOrdersResponse(orderIds: string[]) {
  return {
    data: {
      allOrders: {
        totalCount: orderIds.length,
        pageInfo: { hasNextPage: false, hasPreviousPage: false },
        edges: orderIds.map((orderId) => ({ node: { orderId } })),
      },
    },
  };
}

const flagOnState = {
  company: buildCompanyStateWith({ customer: { role: CustomerRole.B2C } }),
  global: buildGlobalStateWith({
    featureFlags: { 'B2B-4613.buyer_portal_unified_sf_gql_orders': true },
  }),
};

const b2bUserFlagOnState = {
  company: buildCompanyStateWith({
    customer: { role: CustomerRole.SENIOR_BUYER, userType: UserTypes.MULTIPLE_B2C },
    companyInfo: { status: CompanyStatus.APPROVED },
  }),
  global: buildGlobalStateWith({
    featureFlags: { 'B2B-4613.buyer_portal_unified_sf_gql_orders': true },
  }),
};

const b2bUserFlagOffState = {
  company: buildCompanyStateWith({
    customer: { role: CustomerRole.SENIOR_BUYER, userType: UserTypes.MULTIPLE_B2C },
    companyInfo: { status: CompanyStatus.APPROVED },
  }),
  global: buildGlobalStateWith({
    featureFlags: { 'B2B-4613.buyer_portal_unified_sf_gql_orders': false },
  }),
};

const bcUserFlagOffState = {
  company: buildCompanyStateWith({ customer: { role: CustomerRole.B2C } }),
  global: buildGlobalStateWith({
    featureFlags: { 'B2B-4613.buyer_portal_unified_sf_gql_orders': false },
  }),
};

function renderDetailPagination(locationState: object, preloadedState: object) {
  const onChange = vi.fn();
  return {
    ...renderWithProviders(<DetailPagination onChange={onChange} color="#000000" />, {
      preloadedState,
      initialEntries: [{ state: locationState }],
    }),
    onChange,
  };
}

const unifiedLocationState = {
  isCompanyOrder: false,
  totalCount: 3,
  unifiedCustomerFilters: { status: 'Pending' },
  unifiedCustomerSortBy: OrdersSortInput.CREATED_AT_NEWEST,
  searchParams: { orderBy: '-createdAt', offset: 0, first: 10 },
};

describe('DetailPagination', () => {
  describe('with unified SF GQL orders flag ON, non-company order (SF GQL path)', () => {
    it('renders the order counter and enables both buttons when in the middle of the list', async () => {
      // currentIndex: 1 → fetches first: 3 → edges[0]=prev, edges[1]=current, edges[2]=next
      server.use(
        graphql.query('GetCustomerOrders', () =>
          HttpResponse.json(buildCustomerOrdersResponse([101, 102, 103])),
        ),
      );

      renderDetailPagination({ ...unifiedLocationState, currentIndex: 1 }, flagOnState);

      const nav = await screen.findByRole('navigation', { name: 'Order 2 of 3' });
      const [prev, next] = within(nav).getAllByRole('button');

      await waitFor(() => {
        expect(prev).toBeEnabled();
        expect(next).toBeEnabled();
      });
    });

    it('disables the prev button at the first order (index 0)', async () => {
      // currentIndex: 0 → fetches first: 2 → flag=toLeft → prev disabled
      server.use(
        graphql.query('GetCustomerOrders', () =>
          HttpResponse.json(buildCustomerOrdersResponse([101, 102])),
        ),
      );

      renderDetailPagination({ ...unifiedLocationState, currentIndex: 0 }, flagOnState);

      const nav = await screen.findByRole('navigation', { name: 'Order 1 of 3' });
      const [prev, next] = within(nav).getAllByRole('button');

      await waitFor(() => {
        expect(prev).toBeDisabled();
        expect(next).toBeEnabled();
      });
    });

    it('disables the next button at the last order', async () => {
      // currentIndex: 2 → fetches first: 4, but only 3 exist → edges[3] absent → flag=toRight → next disabled
      server.use(
        graphql.query('GetCustomerOrders', () =>
          HttpResponse.json(buildCustomerOrdersResponse([101, 102, 103])),
        ),
      );

      renderDetailPagination({ ...unifiedLocationState, currentIndex: 2 }, flagOnState);

      const nav = await screen.findByRole('navigation', { name: 'Order 3 of 3' });
      const [prev, next] = within(nav).getAllByRole('button');

      await waitFor(() => {
        expect(prev).toBeEnabled();
        expect(next).toBeDisabled();
      });
    });

    it('calls onChange with the next order entityId when next is clicked', async () => {
      server.use(
        graphql.query('GetCustomerOrders', () =>
          HttpResponse.json(buildCustomerOrdersResponse([101, 102, 103])),
        ),
      );

      const { onChange } = renderDetailPagination(
        { ...unifiedLocationState, currentIndex: 1 },
        flagOnState,
      );

      const nav = await screen.findByRole('navigation', { name: 'Order 2 of 3' });
      const [, next] = within(nav).getAllByRole('button');
      await waitFor(() => expect(next).toBeEnabled());

      await userEvent.click(next);

      expect(onChange).toHaveBeenCalledWith(103);
    });

    it('calls onChange with the prev order entityId when prev is clicked', async () => {
      server.use(
        graphql.query('GetCustomerOrders', () =>
          HttpResponse.json(buildCustomerOrdersResponse([101, 102, 103])),
        ),
      );

      const { onChange } = renderDetailPagination(
        { ...unifiedLocationState, currentIndex: 1 },
        flagOnState,
      );

      const nav = await screen.findByRole('navigation', { name: 'Order 2 of 3' });
      const [prev] = within(nav).getAllByRole('button');
      await waitFor(() => expect(prev).toBeEnabled());

      await userEvent.click(prev);

      expect(onChange).toHaveBeenCalledWith(101);
    });
  });

  describe('with unified SF GQL orders flag ON, company order, falls back to legacy path', () => {
    it('calls GetAllOrders (B2B legacy) instead of the unified GetCustomerOrders', async () => {
      const getAllOrders = vi.fn().mockReturnValue(buildAllOrdersResponse(['101', '102', '103']));

      server.use(
        graphql.query('GetAllOrders', ({ query }) => HttpResponse.json(getAllOrders(query))),
      );

      renderDetailPagination(
        {
          isCompanyOrder: true,
          currentIndex: 1,
          totalCount: 3,
          searchParams: { orderBy: '-createdAt', offset: 0, first: 3 },
        },
        b2bUserFlagOnState,
      );

      await waitFor(() => expect(getAllOrders).toHaveBeenCalled());
    });
  });

  describe('with unified SF GQL orders flag OFF (legacy path)', () => {
    it('calls GetAllOrders (B2B legacy) when the unified flag is disabled', async () => {
      const getAllOrders = vi.fn().mockReturnValue(buildAllOrdersResponse(['101', '102', '103']));

      server.use(
        graphql.query('GetAllOrders', ({ query }) => HttpResponse.json(getAllOrders(query))),
      );

      renderDetailPagination(
        {
          isCompanyOrder: false,
          currentIndex: 1,
          totalCount: 3,
          searchParams: { orderBy: '-createdAt', offset: 0, first: 3 },
        },
        b2bUserFlagOffState,
      );

      await waitFor(() => expect(getAllOrders).toHaveBeenCalled());
    });

    it('calls GetCustomerOrders (B2C legacy) when the unified flag is disabled', async () => {
      const getBCOrders = vi
        .fn()
        .mockReturnValue(buildBCOrdersLegacyResponse(['101', '102', '103']));

      server.use(
        graphql.query('GetCustomerOrders', ({ query }) => HttpResponse.json(getBCOrders(query))),
      );

      renderDetailPagination(
        {
          isCompanyOrder: false,
          currentIndex: 1,
          totalCount: 3,
          searchParams: { orderBy: '-createdAt', offset: 0, first: 3 },
        },
        bcUserFlagOffState,
      );

      await waitFor(() => expect(getBCOrders).toHaveBeenCalled());
    });
  });
});
