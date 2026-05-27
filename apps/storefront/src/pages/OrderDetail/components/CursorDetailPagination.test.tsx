import {
  graphql,
  HttpResponse,
  renderWithProviders,
  screen,
  startMockServer,
  waitFor,
} from 'tests/test-utils';

import type { CursorLocationState } from '@/pages/OrderDetail/components/CursorDetailPagination';
import { CursorDetailPagination } from '@/pages/OrderDetail/components/CursorDetailPagination';
import { OrdersSortInput } from '@/shared/service/bc/graphql/orders';

const { server } = startMockServer();

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

const LIST_PAGE_SIZE = 10;

const BASE_ORDERS = [
  { orderId: '100', cursor: 'cursor-100' },
  { orderId: '101', cursor: 'cursor-101' },
  { orderId: '102', cursor: 'cursor-102' },
];

// Base state: 3 orders on the page, current is the middle one (index 1)
const BASE_STATE: CursorLocationState = {
  isCompanyOrder: false,
  currentIndex: 1,
  orders: BASE_ORDERS,
  pageInfo: { hasNextPage: true, hasPreviousPage: true },
  filters: {},
  sortBy: OrdersSortInput.CREATED_AT_NEWEST,
  pageSize: LIST_PAGE_SIZE,
};

function renderComponent(state: CursorLocationState | null, onChange = vi.fn()) {
  return renderWithProviders(<CursorDetailPagination onChange={onChange} color="#000000" />, {
    initialEntries: state ? [{ pathname: '/orderDetail/101', state }] : ['/orderDetail/101'],
  });
}

const getPrevButton = () => screen.getByRole('button', { name: /previous order/i });
const getNextButton = () => screen.getByRole('button', { name: /next order/i });

describe('CursorDetailPagination', () => {
  describe('when there is no cursor state (e.g. direct URL navigation)', () => {
    it('renders nothing', () => {
      const { result } = renderComponent(null);
      expect(result.container).toBeEmptyDOMElement();
    });

    it('renders nothing when orders is an empty array', () => {
      const { result } = renderComponent({ ...BASE_STATE, orders: [], currentIndex: 0 });
      expect(result.container).toBeEmptyDOMElement();
    });
  });

  describe('when cursor state is present', () => {
    it('renders a navigation landmark with two buttons', () => {
      renderComponent(BASE_STATE);
      expect(screen.getByRole('navigation', { name: /order navigation/i })).toBeInTheDocument();
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
          currentIndex: 0,
          orders: BASE_ORDERS.slice(1, 3),
          pageInfo: { hasNextPage: false, hasPreviousPage: false },
        });
        expect(getNextButton()).not.toBeDisabled();
        await user.click(getNextButton());
        expect(getNextButton()).toBeDisabled();
      });
    });

    describe('page boundary navigation', () => {
      it('fetches the previous page with correct variables and lands on its last item', async () => {
        let capturedVariables: Record<string, unknown> = {};
        server.use(
          graphql.query('GetCustomerOrders', ({ variables }) => {
            capturedVariables = variables;
            return HttpResponse.json(
              makeCustomerPage([
                { orderId: 98, cursor: 'cursor-98' },
                { orderId: 99, cursor: 'cursor-99' },
              ]),
            );
          }),
        );
        const onChange = vi.fn();
        const { user } = renderComponent(
          {
            ...BASE_STATE,
            currentIndex: 0,
            pageInfo: { hasNextPage: false, hasPreviousPage: true },
          },
          onChange,
        );
        await user.click(getPrevButton());
        await waitFor(() => {
          expect(onChange).toHaveBeenCalledExactlyOnceWith('99');
          expect(capturedVariables).toMatchObject({
            last: LIST_PAGE_SIZE,
            before: 'cursor-100',
          });
        });
      });

      it('fetches the next page with correct variables and lands on its first item', async () => {
        let capturedVariables: Record<string, unknown> = {};
        server.use(
          graphql.query('GetCustomerOrders', ({ variables }) => {
            capturedVariables = variables;
            return HttpResponse.json(
              makeCustomerPage([
                { orderId: 103, cursor: 'cursor-103' },
                { orderId: 104, cursor: 'cursor-104' },
              ]),
            );
          }),
        );
        const onChange = vi.fn();
        const { user } = renderComponent(
          {
            ...BASE_STATE,
            currentIndex: 2,
            pageInfo: { hasNextPage: true, hasPreviousPage: false },
          },
          onChange,
        );
        await user.click(getNextButton());
        await waitFor(() => {
          expect(onChange).toHaveBeenCalledExactlyOnceWith('103');
          expect(capturedVariables).toMatchObject({
            first: LIST_PAGE_SIZE,
            after: 'cursor-102',
          });
        });
      });

      it('disables prev when the boundary fetch returns no orders', async () => {
        server.use(
          graphql.query('GetCustomerOrders', () => HttpResponse.json(makeCustomerPage([]))),
        );
        const onChange = vi.fn();
        const { user } = renderComponent(
          {
            ...BASE_STATE,
            currentIndex: 0,
            pageInfo: { hasNextPage: false, hasPreviousPage: true },
          },
          onChange,
        );
        await user.click(getPrevButton());
        await waitFor(() => {
          expect(onChange).not.toHaveBeenCalled();
          expect(getPrevButton()).toBeDisabled();
        });
      });

      it('disables next when the boundary fetch returns no orders', async () => {
        server.use(
          graphql.query('GetCustomerOrders', () => HttpResponse.json(makeCustomerPage([]))),
        );
        const onChange = vi.fn();
        const { user } = renderComponent(
          {
            ...BASE_STATE,
            currentIndex: 2,
            pageInfo: { hasNextPage: true, hasPreviousPage: false },
          },
          onChange,
        );
        await user.click(getNextButton());
        await waitFor(() => {
          expect(onChange).not.toHaveBeenCalled();
          expect(getNextButton()).toBeDisabled();
        });
      });

      it('keeps prev enabled when a boundary fetch fails so the user can retry', async () => {
        let callCount = 0;
        server.use(
          graphql.query('GetCustomerOrders', () => {
            callCount += 1;
            if (callCount === 1) {
              return HttpResponse.error();
            }
            return HttpResponse.json(makeCustomerPage([{ orderId: 99, cursor: 'cursor-99' }]));
          }),
        );
        const onChange = vi.fn();
        const { user } = renderComponent(
          {
            ...BASE_STATE,
            currentIndex: 0,
            pageInfo: { hasNextPage: false, hasPreviousPage: true },
          },
          onChange,
        );
        await user.click(getPrevButton());
        await waitFor(() => {
          expect(onChange).not.toHaveBeenCalled();
          expect(getPrevButton()).not.toBeDisabled();
        });
        await user.click(getPrevButton());
        await waitFor(() => {
          expect(onChange).toHaveBeenCalledExactlyOnceWith('99');
        });
      });

      it('keeps next enabled when a boundary fetch fails so the user can retry', async () => {
        let callCount = 0;
        server.use(
          graphql.query('GetCustomerOrders', () => {
            callCount += 1;
            if (callCount === 1) {
              return HttpResponse.error();
            }
            return HttpResponse.json(makeCustomerPage([{ orderId: 103, cursor: 'cursor-103' }]));
          }),
        );
        const onChange = vi.fn();
        const { user } = renderComponent(
          {
            ...BASE_STATE,
            currentIndex: 2,
            pageInfo: { hasNextPage: true, hasPreviousPage: false },
          },
          onChange,
        );
        await user.click(getNextButton());
        await waitFor(() => {
          expect(onChange).not.toHaveBeenCalled();
          expect(getNextButton()).not.toBeDisabled();
        });
        await user.click(getNextButton());
        await waitFor(() => {
          expect(onChange).toHaveBeenCalledExactlyOnceWith('103');
        });
      });
    });

    describe('company order path', () => {
      it('uses GetCompanyOrders (not GetCustomerOrders) when isCompanyOrder is true', async () => {
        let customerCalls = 0;
        let companyCalls = 0;
        server.use(
          graphql.query('GetCompanyOrders', () => {
            companyCalls += 1;
            return HttpResponse.json(makeCompanyPage([{ orderId: 103, cursor: 'cursor-103' }]));
          }),
          graphql.query('GetCustomerOrders', () => {
            customerCalls += 1;
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
