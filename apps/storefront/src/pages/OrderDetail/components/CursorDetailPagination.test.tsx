import {
  graphql,
  HttpResponse,
  renderWithProviders,
  screen,
  startMockServer,
  waitFor,
} from 'tests/test-utils';

import { CursorDetailPagination } from '@/pages/OrderDetail/components/CursorDetailPagination';
import type { CursorLocationState } from '@/pages/OrderDetail/components/CursorDetailPagination';
import { OrdersSortInput } from '@/shared/service/bc/graphql/orders';

const { server } = startMockServer();

// ---------------------------------------------------------------------------
// MSW response builders
// ---------------------------------------------------------------------------

function makeCustomerPage(
  orders: Array<{ orderId: number; cursor: string }>,
  hasNext = false,
  hasPrev = false,
) {
  return {
    data: {
      customer: {
        orders: {
          edges: orders.map(({ orderId, cursor }) => ({ node: { entityId: orderId }, cursor })),
          pageInfo: {
            hasNextPage: hasNext,
            hasPreviousPage: hasPrev,
            startCursor: null,
            endCursor: null,
          },
        },
      },
    },
  };
}

function makeCompanyPage(
  orders: Array<{ orderId: number; cursor: string }>,
  hasNext = false,
  hasPrev = false,
) {
  return {
    data: {
      customer: {
        activeCompany: {
          orders: {
            edges: orders.map(({ orderId, cursor }) => ({ node: { entityId: orderId }, cursor })),
            pageInfo: {
              hasNextPage: hasNext,
              hasPreviousPage: hasPrev,
              startCursor: null,
              endCursor: null,
            },
            collectionInfo: null,
          },
        },
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Base state: 3 orders on the page, current is the middle one (index 1)
// ---------------------------------------------------------------------------

const BASE_ORDERS = [
  { orderId: '100', cursor: 'cursor-100' },
  { orderId: '101', cursor: 'cursor-101' },
  { orderId: '102', cursor: 'cursor-102' },
];

const BASE_STATE: CursorLocationState = {
  isCompanyOrder: false,
  currentIndex: 1,
  orders: BASE_ORDERS,
  pageInfo: { hasNextPage: true, hasPreviousPage: true },
  filters: {},
  sortBy: OrdersSortInput.CREATED_AT_NEWEST,
};

function renderComponent(state: CursorLocationState | null, onChange = vi.fn()) {
  return renderWithProviders(<CursorDetailPagination onChange={onChange} color="#000000" />, {
    initialEntries: state ? [{ pathname: '/orderDetail/101', state }] : ['/orderDetail/101'],
  });
}

const getPrevButton = () => screen.getByRole('button', { name: /previous order/i });
const getNextButton = () => screen.getByRole('button', { name: /next order/i });

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CursorDetailPagination', () => {
  describe('when there is no cursor state (e.g. direct URL navigation)', () => {
    it('renders nothing', () => {
      const { result } = renderComponent(null);
      expect(result.container).toBeEmptyDOMElement();
    });
  });

  describe('when cursor state is present', () => {
    it('renders a navigation landmark with two buttons', () => {
      renderComponent(BASE_STATE);
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(getPrevButton()).toBeInTheDocument();
      expect(getNextButton()).toBeInTheDocument();
    });

    describe('initial button enabled/disabled states', () => {
      it('enables both buttons when in the middle of the page', () => {
        renderComponent(BASE_STATE);
        expect(getPrevButton()).not.toBeDisabled();
        expect(getNextButton()).not.toBeDisabled();
      });

      it('disables prev when on the first item and hasPreviousPage is false', () => {
        renderComponent({
          ...BASE_STATE,
          currentIndex: 0,
          pageInfo: { hasNextPage: true, hasPreviousPage: false },
        });
        expect(getPrevButton()).toBeDisabled();
        expect(getNextButton()).not.toBeDisabled();
      });

      it('disables next when on the last item and hasNextPage is false', () => {
        renderComponent({
          ...BASE_STATE,
          currentIndex: 2,
          pageInfo: { hasNextPage: false, hasPreviousPage: true },
        });
        expect(getPrevButton()).not.toBeDisabled();
        expect(getNextButton()).toBeDisabled();
      });

      it('enables prev when on the first item but hasPreviousPage is true (page boundary)', () => {
        renderComponent({
          ...BASE_STATE,
          currentIndex: 0,
          pageInfo: { hasNextPage: false, hasPreviousPage: true },
        });
        expect(getPrevButton()).not.toBeDisabled();
      });

      it('enables next when on the last item but hasNextPage is true (page boundary)', () => {
        renderComponent({
          ...BASE_STATE,
          currentIndex: 2,
          pageInfo: { hasNextPage: true, hasPreviousPage: false },
        });
        expect(getNextButton()).not.toBeDisabled();
      });
    });

    describe('in-page navigation (zero API calls)', () => {
      it('calls onChange with the previous orderId', async () => {
        const onChange = vi.fn();
        const { user } = renderComponent(BASE_STATE, onChange);
        await user.click(getPrevButton());
        expect(onChange).toHaveBeenCalledExactlyOnceWith('100');
      });

      it('calls onChange with the next orderId', async () => {
        const onChange = vi.fn();
        const { user } = renderComponent(BASE_STATE, onChange);
        await user.click(getNextButton());
        expect(onChange).toHaveBeenCalledExactlyOnceWith('102');
      });

      it('disables prev after navigating back to the first item with no previous page', async () => {
        const { user } = renderComponent({
          ...BASE_STATE,
          currentIndex: 1,
          orders: BASE_ORDERS.slice(0, 2),
          pageInfo: { hasNextPage: false, hasPreviousPage: false },
        });
        await user.click(getPrevButton());
        expect(getPrevButton()).toBeDisabled();
      });

      it('disables next after navigating forward to the last item with no next page', async () => {
        const { user } = renderComponent({
          ...BASE_STATE,
          currentIndex: 1,
          orders: BASE_ORDERS.slice(1, 3),
          pageInfo: { hasNextPage: false, hasPreviousPage: false },
        });
        await user.click(getNextButton());
        expect(getNextButton()).toBeDisabled();
      });
    });

    describe('page boundary navigation', () => {
      it('lands on the last item of the fetched previous page', async () => {
        server.use(
          graphql.query('GetCustomerOrders', () =>
            HttpResponse.json(
              makeCustomerPage([
                { orderId: 98, cursor: 'cursor-98' },
                { orderId: 99, cursor: 'cursor-99' },
              ]),
            ),
          ),
        );
        const onChange = vi.fn();
        const { user } = renderComponent({
          ...BASE_STATE,
          currentIndex: 0,
          pageInfo: { hasNextPage: false, hasPreviousPage: true },
        }, onChange);
        await user.click(getPrevButton());
        await waitFor(() => expect(onChange).toHaveBeenCalledExactlyOnceWith('99'));
      });

      it('lands on the first item of the fetched next page', async () => {
        server.use(
          graphql.query('GetCustomerOrders', () =>
            HttpResponse.json(
              makeCustomerPage([
                { orderId: 103, cursor: 'cursor-103' },
                { orderId: 104, cursor: 'cursor-104' },
              ]),
            ),
          ),
        );
        const onChange = vi.fn();
        const { user } = renderComponent({
          ...BASE_STATE,
          currentIndex: 2,
          pageInfo: { hasNextPage: true, hasPreviousPage: false },
        }, onChange);
        await user.click(getNextButton());
        await waitFor(() => expect(onChange).toHaveBeenCalledExactlyOnceWith('103'));
      });

      it('passes last:pageSize before:firstCursor when fetching the previous page', async () => {
        let capturedVariables: Record<string, unknown> = {};
        server.use(
          graphql.query('GetCustomerOrders', ({ variables }) => {
            capturedVariables = variables;
            return HttpResponse.json(makeCustomerPage([{ orderId: 99, cursor: 'cursor-99' }]));
          }),
        );
        const { user } = renderComponent({
          ...BASE_STATE,
          currentIndex: 0,
          pageInfo: { hasNextPage: false, hasPreviousPage: true },
        });
        await user.click(getPrevButton());
        await waitFor(() =>
          expect(capturedVariables).toMatchObject({
            last: BASE_ORDERS.length,
            before: 'cursor-100',
          }),
        );
      });

      it('passes first:pageSize after:lastCursor when fetching the next page', async () => {
        let capturedVariables: Record<string, unknown> = {};
        server.use(
          graphql.query('GetCustomerOrders', ({ variables }) => {
            capturedVariables = variables;
            return HttpResponse.json(makeCustomerPage([{ orderId: 103, cursor: 'cursor-103' }]));
          }),
        );
        const { user } = renderComponent({
          ...BASE_STATE,
          currentIndex: 2,
          pageInfo: { hasNextPage: true, hasPreviousPage: false },
        });
        await user.click(getNextButton());
        await waitFor(() =>
          expect(capturedVariables).toMatchObject({
            first: BASE_ORDERS.length,
            after: 'cursor-102',
          }),
        );
      });
    });

    describe('company order path', () => {
      it('uses GetCompanyOrders (not GetCustomerOrders) when isCompanyOrder is true', async () => {
        let customerCalls = 0;
        let companyCalls = 0;
        server.use(
          graphql.query('GetCompanyOrders', () => {
            companyCalls++;
            return HttpResponse.json(makeCompanyPage([{ orderId: 103, cursor: 'cursor-103' }]));
          }),
          graphql.query('GetCustomerOrders', () => {
            customerCalls++;
            return HttpResponse.json(makeCustomerPage([{ orderId: 103, cursor: 'cursor-103' }]));
          }),
        );
        const { user } = renderComponent({
          ...BASE_STATE,
          isCompanyOrder: true,
          currentIndex: 2,
          pageInfo: { hasNextPage: true, hasPreviousPage: false },
        });
        await user.click(getNextButton());
        await waitFor(() => {
          expect(companyCalls).toBe(1);
          expect(customerCalls).toBe(0);
        });
      });
    });
  });
});
