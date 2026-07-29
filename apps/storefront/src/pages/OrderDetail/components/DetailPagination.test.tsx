import { useLocation, useNavigate } from 'react-router-dom';
import {
  buildCompanyStateWith,
  builder,
  buildStoreInfoStateWith,
  faker,
  graphql,
  HttpResponse,
  renderWithProviders,
  screen,
  startMockServer,
  waitFor,
  within,
} from 'tests/test-utils';

import { CustomerRole } from '@/types';

import { DetailPagination } from './DetailPagination';

const { server } = startMockServer();

const buildOrderNodeWith = builder(() => ({
  node: {
    orderId: faker.number.int().toString(),
  },
}));

const buildOrdersResponseWith = builder(() => ({
  data: {
    customerOrders: {
      totalCount: faker.number.int({ min: 3 }),
      pageInfo: {
        hasNextPage: true,
        hasPreviousPage: true,
      },
      edges: [buildOrderNodeWith('WHATEVER_VALUES')],
    },
  },
}));

const preloadedState = {
  company: buildCompanyStateWith({
    customer: {
      role: CustomerRole.B2C,
    },
  }),
  storeInfo: buildStoreInfoStateWith({ timeFormat: { display: 'j F Y' } }),
};

function PaginationHarness({ onChange }: { onChange: (orderId: string | number) => void }) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <>
      <button type="button" onClick={() => navigate(-1)}>
        Browser back
      </button>
      {location.state && (
        <DetailPagination key={location.key} onChange={onChange} color="#000000" />
      )}
    </>
  );
}

function renderPagination() {
  const firstOrderId = faker.number.int({ min: 100_000, max: 999_997 });
  const previousOrderId = firstOrderId.toString();
  const currentOrderId = (firstOrderId + 1).toString();
  const nextOrderId = (firstOrderId + 2).toString();
  let ordersRequestCompleted = false;

  server.use(
    graphql.query('GetCustomerOrders', () => {
      ordersRequestCompleted = true;

      return HttpResponse.json(
        buildOrdersResponseWith({
          data: {
            customerOrders: {
              totalCount: 3,
              edges: [
                buildOrderNodeWith({ node: { orderId: previousOrderId } }),
                buildOrderNodeWith({ node: { orderId: currentOrderId } }),
                buildOrderNodeWith({ node: { orderId: nextOrderId } }),
              ],
            },
          },
        }),
      );
    }),
  );

  const view = renderWithProviders(<PaginationHarness onChange={vi.fn()} />, {
    preloadedState,
    initialEntries: [
      '/orders',
      {
        pathname: `/orderDetail/${currentOrderId}`,
        state: {
          isCompanyOrder: false,
          currentIndex: 1,
          totalCount: 3,
          searchParams: {
            orderBy: '-createdAt',
            offset: 0,
          },
        },
      },
    ],
  });

  return {
    ...view,
    currentOrderId,
    nextOrderId,
    previousOrderId,
    waitForOrders: () => waitFor(() => expect(ordersRequestCompleted).toBe(true)),
  };
}

describe('DetailPagination route synchronization', () => {
  it('keeps the next order selected after the route remounts', async () => {
    const { navigation, nextOrderId, user, waitForOrders } = renderPagination();
    await waitForOrders();

    const pagination = screen.getByRole('navigation', { name: 'Order 2 of 3' });
    const nextButton = within(pagination).getAllByRole('button')[1];
    await waitFor(() => {
      expect(nextButton).toBeEnabled();
    });
    await user.click(nextButton);

    await waitFor(() => {
      expect(navigation).toHaveBeenCalledWith(`/orderDetail/${nextOrderId}`);
    });
    expect(await screen.findByRole('navigation', { name: 'Order 3 of 3' })).toBeVisible();
  });

  it('keeps the previous order selected after the route remounts', async () => {
    const { navigation, previousOrderId, user, waitForOrders } = renderPagination();
    await waitForOrders();

    const pagination = screen.getByRole('navigation', { name: 'Order 2 of 3' });
    const previousButton = within(pagination).getAllByRole('button')[0];
    await waitFor(() => {
      expect(previousButton).toBeEnabled();
    });
    await user.click(previousButton);

    await waitFor(() => {
      expect(navigation).toHaveBeenCalledWith(`/orderDetail/${previousOrderId}`);
    });
    expect(await screen.findByRole('navigation', { name: 'Order 1 of 3' })).toBeVisible();
  });

  it('returns to the orders list instead of traversing paginated orders', async () => {
    const { navigation, nextOrderId, user, waitForOrders } = renderPagination();
    await waitForOrders();

    const pagination = screen.getByRole('navigation', { name: 'Order 2 of 3' });
    const nextButton = within(pagination).getAllByRole('button')[1];
    await waitFor(() => {
      expect(nextButton).toBeEnabled();
    });
    await user.click(nextButton);

    await waitFor(() => {
      expect(navigation).toHaveBeenCalledWith(`/orderDetail/${nextOrderId}`);
    });

    await user.click(screen.getByRole('button', { name: 'Browser back' }));

    await waitFor(() => {
      expect(navigation).toHaveBeenCalledWith('/orders');
    });
  });
});
