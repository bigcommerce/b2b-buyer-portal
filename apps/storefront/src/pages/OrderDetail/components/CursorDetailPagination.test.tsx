import {
  graphql,
  HttpResponse,
  renderWithProviders,
  screen,
  startMockServer,
  waitFor,
} from 'tests/test-utils';

import {
  CursorDetailPagination,
  type CursorLocationState,
} from '@/pages/OrderDetail/components/CursorDetailPagination';
import { OrdersSortInput } from '@/shared/service/bc/graphql/orders';

const { server } = startMockServer();

const EMPTY_PAGE_INFO = {
  hasNextPage: false,
  hasPreviousPage: false,
  startCursor: null,
  endCursor: null,
};

/**
 * Builds the JSON body returned by MSW for a GetCustomerOrders query.
 * Only the fields consumed by fetchSingleOrder are populated.
 */
function makeCustomerBody(orderId: number, cursor: string) {
  return {
    data: {
      customer: {
        orders: {
          edges: [{ node: { entityId: orderId }, cursor }],
          pageInfo: EMPTY_PAGE_INFO,
        },
      },
    },
  };
}

/**
 * Builds the JSON body returned by MSW for a GetCompanyOrders query.
 */
function makeCompanyBody(orderId: number, cursor: string) {
  return {
    data: {
      customer: {
        activeCompany: {
          orders: {
            edges: [{ node: { entityId: orderId }, cursor }],
            pageInfo: EMPTY_PAGE_INFO,
            collectionInfo: null,
          },
        },
      },
    },
  };
}

/** Empty edges — simulates "no adjacent order found" at a list boundary. */
function makeEmptyCustomerBody() {
  return {
    data: {
      customer: {
        orders: {
          edges: [],
          pageInfo: EMPTY_PAGE_INFO,
        },
      },
    },
  };
}

// Shared fixture — middle of list: … → 100 → [101] → 102 → …
// List page already passed prev/next neighbors; no API calls on mount.
const BASE_STATE: CursorLocationState = {
  isCompanyOrder: false,
  currentOrderId: '101',
  currentCursor: 'cursor-101',
  prevOrderId: '100',
  prevCursor: 'cursor-100',
  nextOrderId: '102',
  nextCursor: 'cursor-102',
  pageInfo: { hasNextPage: true, hasPreviousPage: true },
  filters: {},
  sortBy: OrdersSortInput.CREATED_AT_NEWEST,
};

function renderComponent(state: CursorLocationState | null, onChange = vi.fn()) {
  return renderWithProviders(<CursorDetailPagination onChange={onChange} color="#000000" />, {
    initialEntries: state ? [{ pathname: '/orderDetail/101', state }] : ['/orderDetail/101'],
  });
}

/** Keep consistent with en.json: orderDetail.pagination.previousOrder / nextOrder */
const PREVIOUS_ORDER_LABEL = 'Previous order';
const NEXT_ORDER_LABEL = 'Next order';

const getPrevButton = () => screen.getByRole('button', { name: PREVIOUS_ORDER_LABEL });
const getNextButton = () => screen.getByRole('button', { name: NEXT_ORDER_LABEL });

describe('CursorDetailPagination', () => {
  describe('when there is no cursor state (e.g. direct URL navigation)', () => {
    it('renders nothing', () => {
      const { result } = renderComponent(null);
      expect(result.container).toBeEmptyDOMElement();
    });
  });

  describe('when cursor state is present', () => {
    it('renders a navigation landmark with accessible prev/next buttons', () => {
      renderComponent(BASE_STATE);
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(getPrevButton()).toHaveAccessibleName(PREVIOUS_ORDER_LABEL);
      expect(getNextButton()).toHaveAccessibleName(NEXT_ORDER_LABEL);
    });

    describe('initial button enabled/disabled states', () => {
      it('enables both buttons when in the middle of a list', () => {
        renderComponent(BASE_STATE);
        expect(getPrevButton()).not.toBeDisabled();
        expect(getNextButton()).not.toBeDisabled();
      });

      it('disables the prev button when prevOrderId is null and hasPreviousPage is false', () => {
        renderComponent({
          ...BASE_STATE,
          prevOrderId: null,
          prevCursor: null,
          pageInfo: { hasNextPage: true, hasPreviousPage: false },
        });
        expect(getPrevButton()).toBeDisabled();
        expect(getNextButton()).not.toBeDisabled();
      });

      it('disables the next button when nextOrderId is null and hasNextPage is false', () => {
        renderComponent({
          ...BASE_STATE,
          nextOrderId: null,
          nextCursor: null,
          pageInfo: { hasNextPage: false, hasPreviousPage: true },
        });
        expect(getPrevButton()).not.toBeDisabled();
        expect(getNextButton()).toBeDisabled();
      });

      it('enables prev when prevOrderId is null but hasPreviousPage is true (page boundary)', () => {
        renderComponent({
          ...BASE_STATE,
          prevOrderId: null,
          prevCursor: null,
          pageInfo: { hasNextPage: false, hasPreviousPage: true },
        });
        expect(getPrevButton()).not.toBeDisabled();
      });

      it('enables next when nextOrderId is null but hasNextPage is true (page boundary)', () => {
        renderComponent({
          ...BASE_STATE,
          nextOrderId: null,
          nextCursor: null,
          pageInfo: { hasNextPage: true, hasPreviousPage: false },
        });
        expect(getNextButton()).not.toBeDisabled();
      });
    });

    describe('clicking prev', () => {
      // Before click (BASE_STATE): current=101, known prev=100, known next=102; both buttons enabled.
      // While click: navigate to 100 from prevInfo (no target fetch) → onChange('100');
      //   then one fetch before cursor-100 for the new far-side prev (… → 99).
      it('calls onChange with the previous orderId', async () => {
        // Assertion is sync (onChange before far-side fetch); MSW mock not required.
        const onChange = vi.fn();
        const { user } = renderComponent(BASE_STATE, onChange);

        await user.click(getPrevButton());

        expect(onChange).toHaveBeenCalledExactlyOnceWith('100');
      });

      // Before click: same as BASE_STATE (current=101, prev=100).
      // While click: target 100 from prevInfo; only the far-side refill hits the API
      //   ({ last: 1, before: 'cursor-100' } → order 99).
      it('makes exactly one GetCustomerOrders request to fetch the new far-side order', async () => {
        let callCount = 0;
        server.use(
          graphql.query('GetCustomerOrders', ({ variables }) => {
            callCount += 1;
            expect(variables).toMatchObject({ last: 1, before: 'cursor-100' });
            return HttpResponse.json(makeCustomerBody(99, 'cursor-99'));
          }),
        );

        const { user } = renderComponent(BASE_STATE);
        await user.click(getPrevButton());

        await waitFor(() => expect(callCount).toBe(1));
      });

      // Before click: current=101, prev=100, next unknown (button disabled).
      // While click: navigate to 100; departing 101 becomes next in state (setHasNext(true));
      //   buttons stay disabled until far-side fetch completes (loading=true).
      // Mock resolves that fetch so loading clears and next enables.
      it('immediately enables the next button after navigating back (departing order is the new next)', async () => {
        server.use(
          graphql.query('GetCustomerOrders', () =>
            HttpResponse.json(makeCustomerBody(99, 'cursor-99')),
          ),
        );

        const { user } = renderComponent({
          ...BASE_STATE,
          nextOrderId: null,
          nextCursor: null,
          pageInfo: { hasNextPage: false, hasPreviousPage: true },
        });

        expect(getNextButton()).toBeDisabled();
        await user.click(getPrevButton());

        await waitFor(() => expect(getNextButton()).not.toBeDisabled());
      });
    });

    describe('clicking next', () => {
      // Before click (BASE_STATE): current=101, known prev=100, known next=102; both buttons enabled.
      // While click: navigate to 102 from nextInfo (no target fetch) → onChange('102');
      //   then one fetch after cursor-102 for the new far-side next (103 → …).
      it('calls onChange with the next orderId', async () => {
        // Assertion is sync (onChange before far-side fetch); MSW mock not required.
        const onChange = vi.fn();
        const { user } = renderComponent(BASE_STATE, onChange);

        await user.click(getNextButton());

        expect(onChange).toHaveBeenCalledExactlyOnceWith('102');
      });
      // Before click: same as BASE_STATE (current=101, next=102).
      // While click: target 102 from nextInfo; only the far-side refill hits the API
      //   ({ first: 1, after: 'cursor-102' } → order 103).
      it('makes exactly one GetCustomerOrders request to fetch the new far-side order', async () => {
        let callCount = 0;
        server.use(
          graphql.query('GetCustomerOrders', ({ variables }) => {
            callCount += 1;
            expect(variables).toMatchObject({ first: 1, after: 'cursor-102' });
            return HttpResponse.json(makeCustomerBody(103, 'cursor-103'));
          }),
        );

        const { user } = renderComponent(BASE_STATE);
        await user.click(getNextButton());

        await waitFor(() => expect(callCount).toBe(1));
      });

      it('immediately enables the prev button after navigating forward (departing order is the new prev)', async () => {
        // Before click: current=101, next=102, prev unknown (button disabled).
        // While click: navigate to 102; departing 101 becomes prev in state (setHasPrev(true));
        //   buttons stay disabled until far-side fetch completes (loading=true).
        // Mock resolves that fetch so loading clears and prev enables.
        server.use(
          graphql.query('GetCustomerOrders', () =>
            HttpResponse.json(makeCustomerBody(103, 'cursor-103')),
          ),
        );

        const { user } = renderComponent({
          ...BASE_STATE,
          prevOrderId: null,
          prevCursor: null,
          pageInfo: { hasNextPage: true, hasPreviousPage: false },
        });

        expect(getPrevButton()).toBeDisabled();
        await user.click(getNextButton());

        await waitFor(() => expect(getPrevButton()).not.toBeDisabled());
      });
    });

    describe('page boundary navigation', () => {
      // prevInfo/nextInfo null on mount — neighbor not on this list page; pageInfo says more exist.

      it('fetches the target order first when clicking prev at a boundary, then fetches the new far side', async () => {
        // Before click: current=101, prev unknown (null prevOrderId), hasPreviousPage=true.
        // While click: (1) fetch target before cursor-101 → 99, onChange('99');
        //   (2) fetch far-side prev before cursor-99 → 98.
        let callCount = 0;
        server.use(
          graphql.query(
            'GetCustomerOrders',
            () => {
              callCount += 1;
              return HttpResponse.json(makeCustomerBody(99, 'cursor-99'));
            },
            { once: true },
          ),
          graphql.query('GetCustomerOrders', () =>
            HttpResponse.json(makeCustomerBody(98, 'cursor-98')),
          ),
        );

        const onChange = vi.fn();
        const { user } = renderComponent(
          {
            ...BASE_STATE,
            prevOrderId: null,
            prevCursor: null,
            pageInfo: { hasNextPage: true, hasPreviousPage: true },
          },
          onChange,
        );

        await user.click(getPrevButton());

        await waitFor(() => {
          expect(onChange).toHaveBeenCalledExactlyOnceWith('99');
          expect(callCount).toBe(1); // first call was consumed; total across both handlers = 2
        });
      });

      it('fetches the target order first when clicking next at a boundary, then fetches the new far side', async () => {
        // Before click: current=101, next unknown (null nextOrderId), hasNextPage=true.
        // While click: (1) fetch target after cursor-101 → 103, onChange('103');
        //   (2) fetch far-side next after cursor-103 → 104.
        let callCount = 0;
        server.use(
          graphql.query(
            'GetCustomerOrders',
            () => {
              callCount += 1;
              return HttpResponse.json(makeCustomerBody(103, 'cursor-103'));
            },
            { once: true },
          ),
          graphql.query('GetCustomerOrders', () =>
            HttpResponse.json(makeCustomerBody(104, 'cursor-104')),
          ),
        );

        const onChange = vi.fn();
        const { user } = renderComponent(
          {
            ...BASE_STATE,
            nextOrderId: null,
            nextCursor: null,
            pageInfo: { hasNextPage: true, hasPreviousPage: true },
          },
          onChange,
        );

        await user.click(getNextButton());

        await waitFor(() => {
          expect(onChange).toHaveBeenCalledExactlyOnceWith('103');
          expect(callCount).toBe(1);
        });
      });

      it('disables the prev button when the API returns no order at the boundary', async () => {
        // Before click: current=101, prev unknown, hasPreviousPage=true (prev button enabled).
        // While click: fetch before cursor-101 returns empty → no target, prev stays disabled.
        server.use(
          graphql.query('GetCustomerOrders', () => HttpResponse.json(makeEmptyCustomerBody())),
        );

        const { user } = renderComponent({
          ...BASE_STATE,
          prevOrderId: null,
          prevCursor: null,
          pageInfo: { hasNextPage: false, hasPreviousPage: true },
        });

        await user.click(getPrevButton());

        await waitFor(() => expect(getPrevButton()).toBeDisabled());
      });
    });

    describe('company order path', () => {
      // Same neighbor flow as BASE_STATE; isCompanyOrder only switches GetCompanyOrders vs GetCustomerOrders.

      it('uses GetCompanyOrders (not GetCustomerOrders) when isCompanyOrder is true', async () => {
        // Before click: current=101, next=102 (BASE_STATE).
        // While click: navigate to 102 from nextInfo; far-side refill uses GetCompanyOrders (→ 103).
        let customerCallCount = 0;
        let companyCallCount = 0;

        server.use(
          graphql.query('GetCompanyOrders', () => {
            companyCallCount += 1;
            return HttpResponse.json(makeCompanyBody(103, 'cursor-103'));
          }),
          graphql.query('GetCustomerOrders', () => {
            customerCallCount += 1;
            return HttpResponse.json(makeCustomerBody(103, 'cursor-103'));
          }),
        );

        const onChange = vi.fn();
        const { user } = renderComponent({ ...BASE_STATE, isCompanyOrder: true }, onChange);
        await user.click(getNextButton());

        await waitFor(() => {
          expect(companyCallCount).toBe(1);
          expect(customerCallCount).toBe(0);
        });
        expect(onChange).toHaveBeenCalledExactlyOnceWith('102');
      });
    });
  });
});
