import {
  buildB2BFeaturesStateWith,
  buildCompanyStateWith,
  builder,
  buildStoreInfoStateWith,
  bulk,
  faker,
  getUnixTime,
  graphql,
  HttpResponse,
  renderWithProviders,
  screen,
  startMockServer,
  stringContainingAll,
  userEvent,
  waitFor,
  waitForElementToBeRemoved,
  within,
} from 'tests/test-utils';
import { when } from 'vitest-when';

import {
  CompanyOrderNode,
  CompanyOrderStatuses,
  CustomerOrderNode,
  CustomerOrderStatues,
  CustomerOrderStatus,
  GetCompanyOrders,
  GetCustomerOrders,
} from '@/shared/service/b2b/graphql/orders';
import { CompanyStatus, CustomerRole, UserTypes } from '@/types';

import MyOrders from '.';

const { server } = startMockServer();

const buildCustomerOrderNodeWith = builder<CustomerOrderNode>(() => ({
  node: {
    orderId: faker.string.numeric({ length: 4 }),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    createdAt: getUnixTime(faker.date.past()),
    updatedAt: getUnixTime(faker.date.recent()),
    isArchived: faker.datatype.boolean(),
    isInvoiceOrder: faker.helpers.arrayElement(['A_1', 'A_0']),
    totalIncTax: faker.number.float(),
    currencyCode: faker.finance.currencyCode(),
    usdIncTax: faker.number.float(),
    items: faker.number.int(),
    userId: faker.number.int(),
    poNumber: faker.string.numeric({ length: 5 }),
    referenceNumber: faker.string.numeric({ length: 3 }),
    status: faker.word.noun(),
    customStatus: faker.word.noun(),
    statusCode: faker.number.int(),
    ipStatus: faker.helpers.arrayElement(['A_0', 'A_1', 'A_2']),
    flag: faker.helpers.arrayElement(['A_0', 'A_1', 'A_2', 'A_3']),
    billingName: faker.person.fullName(),
    merchantEmail: faker.internet.email(),
  },
}));

const buildOrderStatusWith = builder<CustomerOrderStatus>(() => ({
  statusCode: faker.string.numeric({ length: 4 }),
  systemLabel: faker.word.noun(),
  customLabel: faker.word.noun(),
}));

const buildCustomerOrderStatusesWith = builder<CustomerOrderStatues>(() => ({
  data: {
    bcOrderStatuses: bulk(buildOrderStatusWith, 'WHATEVER_VALUES').times(3),
  },
}));

const buildGetCustomerOrdersWith = builder<GetCustomerOrders>(() => {
  const numberOfOrders = faker.number.int({ min: 1, max: 10 });

  return {
    data: {
      customerOrders: {
        totalCount: faker.number.int({ min: numberOfOrders, max: 100 }),
        pageInfo: {
          hasNextPage: faker.datatype.boolean(),
          hasPreviousPage: faker.datatype.boolean(),
        },
        edges: bulk(buildCustomerOrderNodeWith, 'WHATEVER_VALUES').times(numberOfOrders),
      },
    },
  };
});

describe('when a personal customer', () => {
  const preloadedState = {
    company: buildCompanyStateWith({
      customer: {
        role: CustomerRole.B2C,
      },
    }),
    storeInfo: buildStoreInfoStateWith({ timeFormat: { display: 'j F Y' } }),
  };

  beforeEach(() => {
    server.use(
      graphql.query('GetCustomerOrderStatuses', () =>
        HttpResponse.json(buildCustomerOrderStatusesWith('WHATEVER_VALUES')),
      ),
    );
  });

  describe('has placed orders', () => {
    it('displays a table with order information', async () => {
      const getOrders = vi.fn();

      server.use(
        graphql.query('GetCustomerOrders', ({ query }) => HttpResponse.json(getOrders(query))),
      );

      when(getOrders)
        .calledWith(stringContainingAll('isShowMy: "0"', 'first: 10', 'offset: 0'))
        .thenReturn(buildGetCustomerOrdersWith('WHATEVER_VALUES'));

      renderWithProviders(<MyOrders />, { preloadedState });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      const table = screen.getByRole('table');

      const columnHeaders = within(table).getAllByRole('columnheader');

      expect(columnHeaders[0]).toHaveTextContent('Order');
      expect(columnHeaders[1]).toHaveTextContent('PO / Reference');
      expect(columnHeaders[2]).toHaveTextContent('Grand total');
      expect(columnHeaders[3]).toHaveTextContent('Order status');
      expect(columnHeaders[4]).toHaveTextContent('Created on');
    });

    it('displays all the orders associated with the customer', async () => {
      server.use(
        graphql.query('GetCustomerOrders', () =>
          HttpResponse.json(
            buildGetCustomerOrdersWith({
              data: {
                customerOrders: {
                  totalCount: 2,
                  edges: [
                    buildCustomerOrderNodeWith({ node: { orderId: '66996' } }),
                    buildCustomerOrderNodeWith({ node: { orderId: '66986' } }),
                  ],
                },
              },
            }),
          ),
        ),
      );

      renderWithProviders(<MyOrders />, { preloadedState });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      expect(screen.getByRole('row', { name: /66996/ })).toBeInTheDocument();
      expect(screen.getByRole('row', { name: /66986/ })).toBeInTheDocument();
    });

    it('displays all the information associated with an order', async () => {
      const order66996 = buildCustomerOrderNodeWith({
        node: {
          orderId: '66996',
          poNumber: '0022',
          totalIncTax: 100,
          status: 'Pending',
          createdAt: getUnixTime(new Date('13 March 2025')),
        },
      });

      server.use(
        graphql.query('GetCustomerOrderStatuses', () =>
          HttpResponse.json(
            buildCustomerOrderStatusesWith({
              data: {
                bcOrderStatuses: [
                  buildOrderStatusWith({ systemLabel: 'Pending', customLabel: 'Pending' }),
                  buildOrderStatusWith('WHATEVER_VALUES'),
                ],
              },
            }),
          ),
        ),
        graphql.query('GetCustomerOrders', () =>
          HttpResponse.json(
            buildGetCustomerOrdersWith({
              data: {
                customerOrders: {
                  totalCount: 1,
                  edges: [order66996],
                },
              },
            }),
          ),
        ),
      );

      renderWithProviders(<MyOrders />, { preloadedState });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      const row = screen.getByRole('row', { name: /66996/ });

      expect(within(row).getByRole('cell', { name: '66996' })).toBeInTheDocument();
      expect(within(row).getByRole('cell', { name: '0022' })).toBeInTheDocument();
      expect(within(row).getByRole('cell', { name: '$100.00' })).toBeInTheDocument();
      expect(within(row).getByRole('cell', { name: 'Pending' })).toBeInTheDocument();
      expect(within(row).getByRole('cell', { name: '13 March 2025' })).toBeInTheDocument();
    });

    it('displays `-` when the poNumber is missing', async () => {
      const order66996 = buildCustomerOrderNodeWith({
        node: {
          orderId: '66996',
          poNumber: '',
        },
      });

      server.use(
        graphql.query('GetCustomerOrders', () =>
          HttpResponse.json(
            buildGetCustomerOrdersWith({
              data: {
                customerOrders: {
                  totalCount: 1,
                  edges: [order66996],
                },
              },
            }),
          ),
        ),
      );

      renderWithProviders(<MyOrders />, { preloadedState });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      const row = screen.getByRole('row', { name: /66996/ });

      // The character U+2013 "–" could be confused with the ASCII character U+002d "-", which is more common in source code.
      expect(within(row).getByRole('cell', { name: '–' })).toBeInTheDocument();
    });

    it('formats the total price based on the money property', async () => {
      const order66996 = buildCustomerOrderNodeWith({
        node: {
          orderId: '66996',
          totalIncTax: 1000,
          money: JSON.stringify(
            JSON.stringify({
              currency_location: 'right',
              currency_token: '€',
              decimal_token: ',',
              decimal_places: 1,
              thousands_token: '.',
            }),
          ),
        },
      });

      server.use(
        graphql.query('GetCustomerOrders', () =>
          HttpResponse.json(
            buildGetCustomerOrdersWith({
              data: {
                customerOrders: {
                  totalCount: 1,
                  edges: [order66996],
                },
              },
            }),
          ),
        ),
      );

      renderWithProviders(<MyOrders />, { preloadedState });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      const row = screen.getByRole('row', { name: /66996/ });

      expect(within(row).getByRole('cell', { name: '1.000,0€' })).toBeInTheDocument();
    });

    it('sorts orders by ID by default', async () => {
      const getOrders = vi.fn();

      when(getOrders)
        .calledWith(stringContainingAll('orderBy: "-bcOrderId"'))
        .thenReturn(buildGetCustomerOrdersWith('WHATEVER_VALUES'));

      server.use(
        graphql.query('GetCustomerOrders', ({ query }) => HttpResponse.json(getOrders(query))),
      );

      renderWithProviders(<MyOrders />, { preloadedState });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      const table = screen.getByRole('table');
      const orderHeader = within(table).getByRole('columnheader', { name: 'Order' });

      expect(orderHeader).toHaveAttribute('aria-sort', 'descending');
    });

    it('toggles sort order when clicking the current sort column', async () => {
      const getOrders = vi.fn();

      const order66996 = buildCustomerOrderNodeWith({ node: { orderId: '66996' } });
      const order3998 = buildCustomerOrderNodeWith({ node: { orderId: '3998' } });

      when(getOrders)
        .calledWith(stringContainingAll('orderBy: "bcOrderId"'))
        .thenReturn(
          buildGetCustomerOrdersWith({
            data: {
              customerOrders: {
                totalCount: 2,
                edges: [order3998, order66996],
              },
            },
          }),
        );

      when(getOrders)
        .calledWith(stringContainingAll('orderBy: "-bcOrderId"'))
        .thenReturn(
          buildGetCustomerOrdersWith({
            data: {
              customerOrders: {
                totalCount: 2,
                edges: [order66996, order3998],
              },
            },
          }),
        );

      server.use(
        graphql.query('GetCustomerOrders', ({ query }) => HttpResponse.json(getOrders(query))),
      );

      renderWithProviders(<MyOrders />, { preloadedState });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      await waitFor(() => {
        // row 0 is the header row
        expect(screen.getAllByRole('row')[1]).toHaveTextContent('66996');
      });

      const orderIdHeader = screen.getByRole('columnheader', { name: 'Order' });

      expect(orderIdHeader).toHaveAttribute('aria-sort', 'descending');

      await userEvent.click(within(orderIdHeader).getByRole('button'));

      await waitFor(() => {
        // row 0 is the header row
        expect(screen.getAllByRole('row')[1]).toHaveTextContent('3998');
      });

      expect(screen.getByRole('columnheader', { name: 'Order' })).toHaveAttribute(
        'aria-sort',
        'ascending',
      );
    });

    it('sorts orders by different columns', async () => {
      const getOrders = vi.fn().mockReturnValue(buildGetCustomerOrdersWith('WHATEVER_VALUES'));

      server.use(
        graphql.query('GetCustomerOrders', ({ query }) => HttpResponse.json(getOrders(query))),
      );

      renderWithProviders(<MyOrders />, { preloadedState });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      const createdOnHeader = screen.getByRole('columnheader', { name: 'Created on' });

      expect(createdOnHeader).not.toHaveAttribute('aria-sort');

      when(getOrders)
        .calledWith(stringContainingAll('orderBy: "-createdAt"'))
        .thenReturn(
          buildGetCustomerOrdersWith({
            data: {
              customerOrders: {
                totalCount: 1,
                edges: [buildCustomerOrderNodeWith({ node: { orderId: '66996' } })],
              },
            },
          }),
        );

      await userEvent.click(within(createdOnHeader).getByRole('button'));

      await waitFor(() => {
        expect(screen.getByRole('row', { name: /66996/ })).toBeInTheDocument();
      });

      expect(screen.getByRole('columnheader', { name: 'Created on' })).toHaveAttribute(
        'aria-sort',
        'descending',
      );
    });

    it('can change the number of rows per page', async () => {
      const getOrders = vi.fn().mockReturnValue(buildGetCustomerOrdersWith('WHATEVER_VALUES'));

      server.use(
        graphql.query('GetCustomerOrders', ({ query }) => HttpResponse.json(getOrders(query))),
      );

      renderWithProviders(<MyOrders />, { preloadedState });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      when(getOrders)
        .calledWith(stringContainingAll('first: 20', 'offset: 0'))
        .thenReturn(
          buildGetCustomerOrdersWith({
            data: {
              customerOrders: {
                totalCount: 1,
                edges: [buildCustomerOrderNodeWith({ node: { orderId: '66996' } })],
              },
            },
          }),
        );

      await userEvent.click(screen.getByRole('combobox', { name: /Rows per page/ }));
      await userEvent.click(screen.getByRole('option', { name: '20' }));

      await waitFor(() => {
        expect(screen.getByRole('row', { name: /66996/ })).toBeInTheDocument();
      });
    });

    it('can go to the next page', async () => {
      const getOrders = vi.fn().mockReturnValue(
        buildGetCustomerOrdersWith({
          data: {
            customerOrders: {
              totalCount: 100,
            },
          },
        }),
      );

      server.use(
        graphql.query('GetCustomerOrders', ({ query }) => HttpResponse.json(getOrders(query))),
      );

      renderWithProviders(<MyOrders />, { preloadedState });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      when(getOrders)
        .calledWith(stringContainingAll('first: 10', 'offset: 10'))
        .thenReturn(
          buildGetCustomerOrdersWith({
            data: {
              customerOrders: {
                totalCount: 100,
                edges: [buildCustomerOrderNodeWith({ node: { orderId: '66996' } })],
              },
            },
          }),
        );

      const nextPageButton = screen.getByRole('button', { name: /next page/ });
      await userEvent.click(nextPageButton);

      await waitFor(() => {
        expect(screen.getByRole('row', { name: /66996/ })).toBeInTheDocument();
      });
    });

    it('can go to the previous page', async () => {
      const getOrders = vi.fn().mockReturnValue(
        buildGetCustomerOrdersWith({
          data: {
            customerOrders: {
              totalCount: 100,
            },
          },
        }),
      );

      server.use(
        graphql.query('GetCustomerOrders', ({ query }) => HttpResponse.json(getOrders(query))),
      );

      renderWithProviders(<MyOrders />, { preloadedState });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      const nextPageButton = screen.getByRole('button', { name: /next page/ });
      await userEvent.click(nextPageButton);

      when(getOrders)
        .calledWith(stringContainingAll('first: 10', 'offset: 0'))
        .thenReturn(
          buildGetCustomerOrdersWith({
            data: {
              customerOrders: {
                totalCount: 100,
                edges: [buildCustomerOrderNodeWith({ node: { orderId: '66996' } })],
              },
            },
          }),
        );

      const previousPageButton = screen.getByRole('button', { name: /previous page/ });
      await userEvent.click(previousPageButton);

      await waitFor(() => {
        expect(screen.getByRole('row', { name: /66996/ })).toBeInTheDocument();
      });
    });

    it('can search for orders', async () => {
      const getOrders = vi.fn().mockReturnValue(buildGetCustomerOrdersWith('WHATEVER_VALUES'));

      server.use(
        graphql.query('GetCustomerOrders', ({ query }) => HttpResponse.json(getOrders(query))),
      );

      renderWithProviders(<MyOrders />, { preloadedState });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      when(getOrders)
        .calledWith(stringContainingAll('search: "66996"'))
        .thenReturn(
          buildGetCustomerOrdersWith({
            data: {
              customerOrders: {
                totalCount: 1,
                edges: [buildCustomerOrderNodeWith({ node: { orderId: '66996' } })],
              },
            },
          }),
        );

      const searchBox = screen.getByPlaceholderText(/Search/);

      await userEvent.type(searchBox, '66996');

      await waitFor(() => {
        expect(screen.getByRole('row', { name: /66996/ })).toBeInTheDocument();
      });
    });

    it('can filter orders', async () => {
      vi.setSystemTime(new Date('21 November 2022'));

      const getOrders = vi.fn().mockReturnValue(
        buildGetCustomerOrdersWith({
          data: {
            customerOrders: {
              totalCount: 1,
              edges: [buildCustomerOrderNodeWith({ node: { status: 'Pending' } })],
            },
          },
        }),
      );

      server.use(
        graphql.query('GetCustomerOrders', ({ query }) => HttpResponse.json(getOrders(query))),
        graphql.query('GetCustomerOrderStatuses', () =>
          HttpResponse.json(
            buildCustomerOrderStatusesWith({
              data: {
                bcOrderStatuses: [
                  buildOrderStatusWith({ systemLabel: 'Pending', customLabel: 'Pending' }),
                  buildOrderStatusWith('WHATEVER_VALUES'),
                ],
              },
            }),
          ),
        ),
      );

      renderWithProviders(<MyOrders />, { preloadedState });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      when(getOrders)
        .calledWith(
          stringContainingAll(
            'status: "Pending"',
            'beginDateAt: "2022-11-15"',
            'endDateAt: "2022-11-26"',
          ),
        )
        .thenReturn(
          buildGetCustomerOrdersWith({
            data: {
              customerOrders: {
                totalCount: 1,
                edges: [buildCustomerOrderNodeWith({ node: { orderId: '66996' } })],
              },
            },
          }),
        );

      await userEvent.click(screen.getByRole('button', { name: /edit/ }));

      const dialog = await screen.findByRole('dialog', { name: 'Filters' });

      expect(within(dialog).getByRole('heading', { name: 'Filters' })).toBeInTheDocument();

      await userEvent.click(within(dialog).getByRole('combobox'));

      await userEvent.click(screen.getByRole('option', { name: 'Pending' }));

      await userEvent.click(screen.getByRole('textbox', { name: 'From' }));
      await userEvent.click(screen.getByRole('gridcell', { name: /15/ }));

      await userEvent.click(screen.getByRole('textbox', { name: 'To' }));
      await userEvent.click(screen.getByRole('gridcell', { name: /26/ }));

      await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

      await waitFor(() => {
        expect(screen.getByRole('row', { name: /66996/ })).toBeInTheDocument();
      });
    });

    it('can filter orders based on dates', async () => {
      vi.setSystemTime(new Date('21 November 2022'));

      const getOrders = vi.fn().mockReturnValue(buildGetCustomerOrdersWith('WHATEVER_VALUES'));

      server.use(
        graphql.query('GetCustomerOrders', ({ query }) => HttpResponse.json(getOrders(query))),
      );

      renderWithProviders(<MyOrders />, { preloadedState });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      when(getOrders)
        .calledWith(stringContainingAll('beginDateAt: "2022-11-15"', 'endDateAt: "2022-11-26"'))
        .thenReturn(
          buildGetCustomerOrdersWith({
            data: {
              customerOrders: {
                totalCount: 1,
                edges: [buildCustomerOrderNodeWith({ node: { orderId: '66996' } })],
              },
            },
          }),
        );

      await userEvent.click(screen.getByRole('button', { name: /edit/ }));

      const dialog = await screen.findByRole('dialog', { name: 'Filters' });

      await userEvent.click(within(dialog).getByRole('textbox', { name: 'From' }));
      await userEvent.click(screen.getByRole('gridcell', { name: /15/ }));

      await userEvent.click(within(dialog).getByRole('textbox', { name: 'To' }));
      await userEvent.click(screen.getByRole('gridcell', { name: /26/ }));

      await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

      await waitFor(() => {
        expect(screen.getByRole('row', { name: /66996/ })).toBeInTheDocument();
      });
    });

    it('can filter orders based on custom status labels', async () => {
      const getOrders = vi.fn().mockReturnValue(
        buildGetCustomerOrdersWith({
          data: {
            customerOrders: {
              totalCount: 1,
              edges: [buildCustomerOrderNodeWith({ node: { status: 'Pending' } })],
            },
          },
        }),
      );

      server.use(
        graphql.query('GetCustomerOrders', ({ query }) => HttpResponse.json(getOrders(query))),
        graphql.query('GetCustomerOrderStatuses', () =>
          HttpResponse.json(
            buildCustomerOrderStatusesWith({
              data: {
                bcOrderStatuses: [
                  buildOrderStatusWith({ systemLabel: 'Pending', customLabel: 'Awaiting' }),
                ],
              },
            }),
          ),
        ),
      );

      renderWithProviders(<MyOrders />, { preloadedState });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      when(getOrders)
        .calledWith(stringContainingAll('status: "Pending"'))
        .thenReturn(
          buildGetCustomerOrdersWith({
            data: {
              customerOrders: {
                totalCount: 1,
                edges: [buildCustomerOrderNodeWith({ node: { orderId: '66996' } })],
              },
            },
          }),
        );

      await userEvent.click(screen.getByRole('button', { name: /edit/ }));

      const dialog = await screen.findByRole('dialog', { name: 'Filters' });

      expect(within(dialog).getByRole('heading', { name: 'Filters' })).toBeInTheDocument();

      await userEvent.click(within(dialog).getByRole('combobox'));

      await userEvent.click(screen.getByRole('option', { name: 'Awaiting' }));

      await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

      await waitFor(() => {
        expect(screen.getByRole('row', { name: /66996/ })).toBeInTheDocument();
      });
    });

    it('navigates to the order details page when clicking on a row', async () => {
      server.use(
        graphql.query('GetCustomerOrders', () =>
          HttpResponse.json(
            buildGetCustomerOrdersWith({
              data: {
                customerOrders: {
                  totalCount: 1,
                  edges: [buildCustomerOrderNodeWith({ node: { orderId: '66996' } })],
                },
              },
            }),
          ),
        ),
      );

      const { navigation } = renderWithProviders(<MyOrders />, { preloadedState });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      const row = screen.getByRole('row', { name: /66996/ });

      await userEvent.click(row);

      expect(navigation).toHaveBeenCalledWith('/orderDetail/66996');
    });
  });

  describe('has no placed orders', () => {
    it('displays a -no data- message', async () => {
      const getOrders = vi.fn().mockReturnValue(
        buildGetCustomerOrdersWith({
          data: {
            customerOrders: {
              edges: [],
            },
          },
        }),
      );

      server.use(graphql.query('GetCustomerOrders', ({ query }) => getOrders(query)));

      renderWithProviders(<MyOrders />, { preloadedState });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      expect(screen.getByText(/No data/)).toBeInTheDocument();
    });
  });
});

const buildCompanyOrderNodeWith = builder<CompanyOrderNode>(() => ({
  node: {
    orderId: faker.string.numeric({ length: 4 }),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    createdAt: getUnixTime(faker.date.past()),
    updatedAt: getUnixTime(faker.date.recent()),
    isArchived: faker.datatype.boolean(),
    isInvoiceOrder: faker.helpers.arrayElement(['A_1', 'A_0']),
    totalIncTax: faker.number.float(),
    currencyCode: faker.finance.currencyCode(),
    usdIncTax: faker.number.float(),
    items: faker.number.int(),
    userId: faker.number.int(),
    poNumber: faker.string.numeric({ length: 5 }),
    referenceNumber: faker.string.numeric({ length: 3 }),
    status: faker.word.noun(),
    customStatus: faker.word.noun(),
    statusCode: faker.number.int(),
    ipStatus: faker.helpers.arrayElement(['A_0', 'A_1', 'A_2']),
    flag: faker.helpers.arrayElement(['A_0', 'A_1', 'A_2', 'A_3']),
    billingName: faker.person.fullName(),
    merchantEmail: faker.internet.email(),
    companyName: faker.company.name(),
    companyInfo: {
      companyName: faker.company.name(),
    },
  },
}));

const buildCompanyOrdersWith = builder<GetCompanyOrders>(() => ({
  data: {
    allOrders: {
      totalCount: faker.number.int({ min: 1, max: 10 }),
      pageInfo: {
        hasNextPage: faker.datatype.boolean(),
        hasPreviousPage: faker.datatype.boolean(),
      },
      edges: bulk(buildCompanyOrderNodeWith, 'WHATEVER_VALUES').times(10),
    },
  },
}));

const buildCompanyOrderStatusesWith = builder<CompanyOrderStatuses>(() => ({
  data: {
    orderStatuses: bulk(buildOrderStatusWith, 'WHATEVER_VALUES').times(3),
  },
}));

describe('when a company customer', () => {
  const preloadedState = {
    company: buildCompanyStateWith({
      customer: {
        role: CustomerRole.SENIOR_BUYER,
        userType: UserTypes.MULTIPLE_B2C,
      },
      companyInfo: {
        status: CompanyStatus.APPROVED,
      },
    }),
    storeInfo: buildStoreInfoStateWith({ timeFormat: { display: 'j F Y' } }),
  };

  beforeEach(() => {
    server.use(
      graphql.query('GetOrderStatuses', () =>
        HttpResponse.json(buildCompanyOrderStatusesWith('WHATEVER_VALUES')),
      ),
    );
  });

  describe('has placed orders', () => {
    it('displays a table with order information', async () => {
      const getAllOrders = vi.fn();

      server.use(
        graphql.query('GetAllOrders', ({ query }) => HttpResponse.json(getAllOrders(query))),
      );

      when(getAllOrders)
        .calledWith(stringContainingAll('isShowMy: "1"', 'first: 10', 'offset: 0'))
        .thenReturn(buildCompanyOrdersWith('WHATEVER_VALUES'));

      renderWithProviders(<MyOrders />, { preloadedState });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      const table = screen.getByRole('table');

      const columnHeaders = within(table).getAllByRole('columnheader');

      expect(columnHeaders[0]).toHaveTextContent('Order');
      expect(columnHeaders[1]).toHaveTextContent('Company');
      expect(columnHeaders[2]).toHaveTextContent('PO / Reference');
      expect(columnHeaders[3]).toHaveTextContent('Grand total');
      expect(columnHeaders[4]).toHaveTextContent('Order status');
      expect(columnHeaders[5]).toHaveTextContent('Created on');
    });

    it('displays all the orders associated with the customer', async () => {
      const getAllOrders = vi.fn();

      server.use(
        graphql.query('GetAllOrders', ({ query }) => HttpResponse.json(getAllOrders(query))),
      );

      when(getAllOrders)
        .calledWith(stringContainingAll('isShowMy: "1"', 'first: 10', 'offset: 0'))
        .thenReturn(
          buildCompanyOrdersWith({
            data: {
              allOrders: {
                totalCount: 2,
                edges: [
                  buildCompanyOrderNodeWith({ node: { orderId: '66996' } }),
                  buildCompanyOrderNodeWith({ node: { orderId: '66986' } }),
                ],
              },
            },
          }),
        );

      renderWithProviders(<MyOrders />, { preloadedState });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      expect(screen.getByRole('row', { name: /66996/ })).toBeInTheDocument();
      expect(screen.getByRole('row', { name: /66986/ })).toBeInTheDocument();
    });

    it('displays all the information associated with an order', async () => {
      const order66996 = buildCompanyOrderNodeWith({
        node: {
          orderId: '66996',
          poNumber: '0022',
          totalIncTax: 100,
          status: 'Pending',
          createdAt: getUnixTime(new Date('13 March 2025')),
          companyInfo: {
            companyName: 'Monsters Inc.',
          },
        },
      });

      server.use(
        graphql.query('GetOrderStatuses', () =>
          HttpResponse.json(
            buildCompanyOrderStatusesWith({
              data: {
                orderStatuses: [
                  buildOrderStatusWith({ systemLabel: 'Pending', customLabel: 'Pending' }),
                  buildOrderStatusWith('WHATEVER_VALUES'),
                ],
              },
            }),
          ),
        ),
        graphql.query('GetAllOrders', () =>
          HttpResponse.json(
            buildCompanyOrdersWith({
              data: {
                allOrders: {
                  totalCount: 1,
                  edges: [order66996],
                },
              },
            }),
          ),
        ),
      );

      renderWithProviders(<MyOrders />, { preloadedState });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      const row = screen.getByRole('row', { name: /66996/ });

      expect(within(row).getByRole('cell', { name: '66996' })).toBeInTheDocument();
      expect(within(row).getByRole('cell', { name: 'Monsters Inc.' })).toBeInTheDocument();
      expect(within(row).getByRole('cell', { name: '0022' })).toBeInTheDocument();
      expect(within(row).getByRole('cell', { name: '$100.00' })).toBeInTheDocument();
      expect(within(row).getByRole('cell', { name: 'Pending' })).toBeInTheDocument();
      expect(within(row).getByRole('cell', { name: '13 March 2025' })).toBeInTheDocument();
    });

    it('displays `-` when the poNumber is missing', async () => {
      const order66996 = buildCompanyOrderNodeWith({
        node: {
          orderId: '66996',
          poNumber: '',
        },
      });

      server.use(
        graphql.query('GetAllOrders', () =>
          HttpResponse.json(
            buildCompanyOrdersWith({
              data: {
                allOrders: {
                  totalCount: 1,
                  edges: [order66996],
                },
              },
            }),
          ),
        ),
      );

      renderWithProviders(<MyOrders />, { preloadedState });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      const row = screen.getByRole('row', { name: /66996/ });

      // The character U+2013 "–" could be confused with the ASCII character U+002d "-", which is more common in source code.
      expect(within(row).getByRole('cell', { name: '–' })).toBeInTheDocument();
    });

    it('displays `-` when the company name is missing', async () => {
      const order66996 = buildCompanyOrderNodeWith({
        node: {
          orderId: '66996',
          companyInfo: {
            companyName: '',
          },
        },
      });

      server.use(
        graphql.query('GetAllOrders', () =>
          HttpResponse.json(
            buildCompanyOrdersWith({
              data: {
                allOrders: {
                  totalCount: 1,
                  edges: [order66996],
                },
              },
            }),
          ),
        ),
      );

      renderWithProviders(<MyOrders />, { preloadedState });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      const row = screen.getByRole('row', { name: /66996/ });

      // The character U+2013 "–" could be confused with the ASCII character U+002d "-", which is more common in source code.
      expect(within(row).getByRole('cell', { name: '–' })).toBeInTheDocument();
    });

    it('formats the total price based on the money property', async () => {
      const order66996 = buildCompanyOrderNodeWith({
        node: {
          orderId: '66996',
          totalIncTax: 1000,
          money: JSON.stringify(
            JSON.stringify({
              currency_location: 'right',
              currency_token: '€',
              decimal_token: ',',
              decimal_places: 1,
              thousands_token: '.',
            }),
          ),
        },
      });

      server.use(
        graphql.query('GetAllOrders', () =>
          HttpResponse.json(
            buildCompanyOrdersWith({
              data: {
                allOrders: {
                  totalCount: 1,
                  edges: [order66996],
                },
              },
            }),
          ),
        ),
      );

      renderWithProviders(<MyOrders />, { preloadedState });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      const row = screen.getByRole('row', { name: /66996/ });

      expect(within(row).getByRole('cell', { name: '1.000,0€' })).toBeInTheDocument();
    });

    it('sorts orders by ID by default', async () => {
      const getOrders = vi.fn();

      server.use(graphql.query('GetAllOrders', ({ query }) => HttpResponse.json(getOrders(query))));

      when(getOrders)
        .calledWith(stringContainingAll('orderBy: "-bcOrderId"'))
        .thenReturn(buildCompanyOrdersWith('WHATEVER_VALUES'));

      renderWithProviders(<MyOrders />, { preloadedState });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      const table = screen.getByRole('table');
      const orderHeader = within(table).getByRole('columnheader', { name: 'Order' });

      expect(orderHeader).toHaveAttribute('aria-sort', 'descending');
    });

    it('toggles sort order when clicking the current sort column', async () => {
      const getOrders = vi.fn().mockReturnValue(buildCompanyOrdersWith('WHATEVER_VALUES'));

      server.use(graphql.query('GetAllOrders', ({ query }) => HttpResponse.json(getOrders(query))));

      renderWithProviders(<MyOrders />, { preloadedState });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      const orderHeader = screen.getByRole('columnheader', { name: 'Order' });

      expect(orderHeader).toHaveAttribute('aria-sort', 'descending');

      when(getOrders)
        .calledWith(stringContainingAll('orderBy: "bcOrderId"'))
        .thenReturn(
          buildCompanyOrdersWith({
            data: {
              allOrders: {
                totalCount: 1,
                edges: [buildCompanyOrderNodeWith({ node: { orderId: '66996' } })],
              },
            },
          }),
        );

      await userEvent.click(within(orderHeader).getByRole('button'));

      await waitFor(() => {
        expect(screen.getByRole('row', { name: /66996/ })).toBeInTheDocument();
      });

      expect(screen.getByRole('columnheader', { name: 'Order' })).toHaveAttribute(
        'aria-sort',
        'ascending',
      );
    });

    it('sorts orders by different columns', async () => {
      const getOrders = vi.fn().mockReturnValue(buildCompanyOrdersWith('WHATEVER_VALUES'));

      server.use(graphql.query('GetAllOrders', ({ query }) => HttpResponse.json(getOrders(query))));

      renderWithProviders(<MyOrders />, { preloadedState });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      const createdOnHeader = screen.getByRole('columnheader', { name: 'Created on' });

      expect(createdOnHeader).not.toHaveAttribute('aria-sort');

      when(getOrders)
        .calledWith(stringContainingAll('orderBy: "-createdAt"'))
        .thenReturn(
          buildCompanyOrdersWith({
            data: {
              allOrders: {
                totalCount: 1,
                edges: [buildCompanyOrderNodeWith({ node: { orderId: '66996' } })],
              },
            },
          }),
        );

      await userEvent.click(within(createdOnHeader).getByRole('button'));

      await waitFor(() => {
        expect(screen.getByRole('row', { name: /66996/ })).toBeInTheDocument();
      });

      expect(screen.getByRole('columnheader', { name: 'Created on' })).toHaveAttribute(
        'aria-sort',
        'descending',
      );
    });

    it('can change the number of rows per page', async () => {
      const getOrders = vi.fn().mockReturnValue(buildCompanyOrdersWith('WHATEVER_VALUES'));

      server.use(graphql.query('GetAllOrders', ({ query }) => HttpResponse.json(getOrders(query))));

      renderWithProviders(<MyOrders />, { preloadedState });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      when(getOrders)
        .calledWith(stringContainingAll('first: 20', 'offset: 0'))
        .thenReturn(
          buildCompanyOrdersWith({
            data: {
              allOrders: {
                totalCount: 1,
                edges: [buildCompanyOrderNodeWith({ node: { orderId: '66996' } })],
              },
            },
          }),
        );

      await userEvent.click(screen.getByRole('combobox', { name: /Rows per page/ }));
      await userEvent.click(screen.getByRole('option', { name: '20' }));

      await waitFor(() => {
        expect(screen.getByRole('row', { name: /66996/ })).toBeInTheDocument();
      });
    });

    it('can go to the next page', async () => {
      const getOrders = vi.fn().mockReturnValue(
        buildCompanyOrdersWith({
          data: {
            allOrders: {
              totalCount: 100,
            },
          },
        }),
      );

      server.use(graphql.query('GetAllOrders', ({ query }) => HttpResponse.json(getOrders(query))));

      renderWithProviders(<MyOrders />, { preloadedState });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      when(getOrders)
        .calledWith(stringContainingAll('first: 10', 'offset: 10'))
        .thenReturn(
          buildCompanyOrdersWith({
            data: {
              allOrders: {
                totalCount: 100,
                edges: [buildCompanyOrderNodeWith({ node: { orderId: '66996' } })],
              },
            },
          }),
        );

      const nextPageButton = screen.getByRole('button', { name: /next page/ });
      await userEvent.click(nextPageButton);

      await waitFor(() => {
        expect(screen.getByRole('row', { name: /66996/ })).toBeInTheDocument();
      });
    });

    it('can go to the previous page', async () => {
      const getOrders = vi.fn().mockReturnValue(
        buildCompanyOrdersWith({
          data: {
            allOrders: {
              totalCount: 100,
            },
          },
        }),
      );

      server.use(graphql.query('GetAllOrders', ({ query }) => HttpResponse.json(getOrders(query))));

      renderWithProviders(<MyOrders />, { preloadedState });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      const nextPageButton = screen.getByRole('button', { name: /next page/ });
      await userEvent.click(nextPageButton);

      when(getOrders)
        .calledWith(stringContainingAll('first: 10', 'offset: 0'))
        .thenReturn(
          buildCompanyOrdersWith({
            data: {
              allOrders: {
                totalCount: 100,
                edges: [buildCompanyOrderNodeWith({ node: { orderId: '66996' } })],
              },
            },
          }),
        );

      const previousPageButton = screen.getByRole('button', { name: /previous page/ });
      await userEvent.click(previousPageButton);

      await waitFor(() => {
        expect(screen.getByRole('row', { name: /66996/ })).toBeInTheDocument();
      });
    });

    it('can search for orders', async () => {
      const getOrders = vi.fn().mockReturnValue(buildCompanyOrdersWith('WHATEVER_VALUES'));

      server.use(graphql.query('GetAllOrders', ({ query }) => HttpResponse.json(getOrders(query))));

      renderWithProviders(<MyOrders />, { preloadedState });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      when(getOrders)
        .calledWith(stringContainingAll('search: "66996"'))
        .thenReturn(
          buildCompanyOrdersWith({
            data: {
              allOrders: {
                totalCount: 1,
                edges: [buildCompanyOrderNodeWith({ node: { orderId: '66996' } })],
              },
            },
          }),
        );

      const searchBox = screen.getByPlaceholderText(/Search/);

      await userEvent.type(searchBox, '66996');

      await waitFor(() => {
        expect(screen.getByRole('row', { name: /66996/ })).toBeInTheDocument();
      });
    });

    it('can filter orders', async () => {
      vi.setSystemTime(new Date('21 November 2022'));

      const getOrders = vi.fn().mockReturnValue(
        buildCompanyOrdersWith({
          data: {
            allOrders: {
              totalCount: 1,
              edges: [buildCompanyOrderNodeWith({ node: { status: 'Pending' } })],
            },
          },
        }),
      );

      server.use(
        graphql.query('GetOrderStatuses', () =>
          HttpResponse.json(
            buildCompanyOrderStatusesWith({
              data: {
                orderStatuses: [
                  buildOrderStatusWith({ systemLabel: 'Pending', customLabel: 'Pending' }),
                  buildOrderStatusWith({ systemLabel: 'Shipped', customLabel: 'Shipped' }),
                  buildOrderStatusWith({ systemLabel: 'Cancelled', customLabel: 'Cancelled' }),
                ],
              },
            }),
          ),
        ),
        graphql.query('GetAllOrders', ({ query }) => HttpResponse.json(getOrders(query))),
      );

      renderWithProviders(<MyOrders />, { preloadedState });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      when(getOrders)
        .calledWith(
          stringContainingAll(
            'status: "Pending"',
            'beginDateAt: "2022-11-15"',
            'endDateAt: "2022-11-26"',
          ),
        )
        .thenReturn(
          buildCompanyOrdersWith({
            data: {
              allOrders: {
                totalCount: 1,
                edges: [buildCompanyOrderNodeWith({ node: { orderId: '66996' } })],
              },
            },
          }),
        );

      await userEvent.click(screen.getByRole('button', { name: /edit/ }));

      const dialog = await screen.findByRole('dialog', { name: 'Filters' });

      await userEvent.click(within(dialog).getByRole('combobox'));

      await userEvent.click(screen.getByRole('option', { name: 'Pending' }));

      await userEvent.click(screen.getByRole('textbox', { name: 'From' }));
      await userEvent.click(screen.getByRole('gridcell', { name: /15/ }));

      await userEvent.click(screen.getByRole('textbox', { name: 'To' }));
      await userEvent.click(screen.getByRole('gridcell', { name: /26/ }));

      await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

      await waitFor(() => {
        expect(screen.getByRole('row', { name: /66996/ })).toBeInTheDocument();
      });
    });

    it('can filter orders based on dates', async () => {
      vi.setSystemTime(new Date('21 November 2022'));

      const getOrders = vi.fn().mockReturnValue(buildCompanyOrdersWith('WHATEVER_VALUES'));

      server.use(graphql.query('GetAllOrders', ({ query }) => HttpResponse.json(getOrders(query))));

      renderWithProviders(<MyOrders />, { preloadedState });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      when(getOrders)
        .calledWith(stringContainingAll('beginDateAt: "2022-11-15"', 'endDateAt: "2022-11-26"'))
        .thenReturn(
          buildCompanyOrdersWith({
            data: {
              allOrders: {
                totalCount: 1,
                edges: [buildCompanyOrderNodeWith({ node: { orderId: '66996' } })],
              },
            },
          }),
        );

      await userEvent.click(screen.getByRole('button', { name: /edit/ }));

      const dialog = await screen.findByRole('dialog', { name: 'Filters' });

      await userEvent.click(within(dialog).getByRole('textbox', { name: 'From' }));
      await userEvent.click(screen.getByRole('gridcell', { name: /15/ }));

      await userEvent.click(within(dialog).getByRole('textbox', { name: 'To' }));
      await userEvent.click(screen.getByRole('gridcell', { name: /26/ }));

      await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

      await waitFor(() => {
        expect(screen.getByRole('row', { name: /66996/ })).toBeInTheDocument();
      });
    });

    it('can filter orders based on custom status labels', async () => {
      const getOrders = vi.fn().mockReturnValue(
        buildCompanyOrdersWith({
          data: {
            allOrders: {
              totalCount: 1,
              edges: [buildCompanyOrderNodeWith({ node: { status: 'Pending' } })],
            },
          },
        }),
      );

      server.use(
        graphql.query('GetOrderStatuses', () =>
          HttpResponse.json(
            buildCompanyOrderStatusesWith({
              data: {
                orderStatuses: [
                  buildOrderStatusWith({ systemLabel: 'Pending', customLabel: 'Awaiting' }),
                ],
              },
            }),
          ),
        ),
        graphql.query('GetAllOrders', ({ query }) => HttpResponse.json(getOrders(query))),
      );

      renderWithProviders(<MyOrders />, { preloadedState });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      when(getOrders)
        .calledWith(stringContainingAll('status: "Pending"'))
        .thenReturn(
          buildCompanyOrdersWith({
            data: {
              allOrders: {
                totalCount: 1,
                edges: [buildCompanyOrderNodeWith({ node: { orderId: '66996' } })],
              },
            },
          }),
        );

      await userEvent.click(screen.getByRole('button', { name: /edit/ }));

      const dialog = await screen.findByRole('dialog', { name: 'Filters' });

      await userEvent.click(within(dialog).getByRole('combobox'));

      await userEvent.click(screen.getByRole('option', { name: 'Awaiting' }));

      await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

      await waitFor(() => {
        expect(screen.getByRole('row', { name: /66996/ })).toBeInTheDocument();
      });
    });

    it('navigates to the order details page when clicking on a row', async () => {
      server.use(
        graphql.query('GetAllOrders', () =>
          HttpResponse.json(
            buildCompanyOrdersWith({
              data: {
                allOrders: {
                  totalCount: 1,
                  edges: [buildCompanyOrderNodeWith({ node: { orderId: '66996' } })],
                },
              },
            }),
          ),
        ),
      );

      const { navigation } = renderWithProviders(<MyOrders />, { preloadedState });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      const row = screen.getByRole('row', { name: /66996/ });

      await userEvent.click(row);

      expect(navigation).toHaveBeenCalledWith('/orderDetail/66996');
    });
  });

  describe('has no placed orders', () => {
    it('displays a -no data- message', async () => {
      const getOrders = vi.fn().mockReturnValue(
        buildCompanyOrdersWith({
          data: {
            allOrders: {
              edges: [],
            },
          },
        }),
      );

      server.use(graphql.query('GetAllOrders', ({ query }) => getOrders(query)));

      renderWithProviders(<MyOrders />, { preloadedState });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      expect(screen.getByText(/No data/)).toBeInTheDocument();
    });
  });
});

describe('when a customer is masquerading as a company customer', () => {
  const preloadedState = {
    company: buildCompanyStateWith({
      customer: {
        role: CustomerRole.SUPER_ADMIN,
      },
    }),
    storeInfo: buildStoreInfoStateWith({ timeFormat: { display: 'j F Y' } }),
    b2bFeatures: buildB2BFeaturesStateWith({
      masqueradeCompany: {
        id: 433,
        isAgenting: true,
      },
    }),
  };

  beforeEach(() => {
    server.use(
      graphql.query('GetOrderStatuses', () =>
        HttpResponse.json(buildCompanyOrderStatusesWith('WHATEVER_VALUES')),
      ),
    );
  });

  describe('has placed orders', () => {
    it('displays a table with order information', async () => {
      server.use(
        graphql.query('GetAllOrders', () =>
          HttpResponse.json(buildCompanyOrdersWith('WHATEVER_VALUES')),
        ),
      );

      renderWithProviders(<MyOrders />, { preloadedState });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      const table = screen.getByRole('table');

      const columnHeaders = within(table).getAllByRole('columnheader');

      expect(columnHeaders[0]).toHaveTextContent('Order');
      expect(columnHeaders[1]).toHaveTextContent('Company');
      expect(columnHeaders[2]).toHaveTextContent('PO / Reference');
      expect(columnHeaders[3]).toHaveTextContent('Grand total');
      expect(columnHeaders[4]).toHaveTextContent('Order status');
      expect(columnHeaders[5]).toHaveTextContent('Created on');
    });
  });

  it('displays all the orders associated with the company', async () => {
    const getAllOrders = vi.fn();

    server.use(
      graphql.query('GetAllOrders', ({ query }) => HttpResponse.json(getAllOrders(query))),
    );

    when(getAllOrders)
      .calledWith(
        stringContainingAll('companyIds: [433,]', 'isShowMy: "1"', 'orderBy: "-bcOrderId"'),
      )
      .thenReturn(
        buildCompanyOrdersWith({
          data: {
            allOrders: {
              totalCount: 2,
              edges: [
                buildCompanyOrderNodeWith({ node: { orderId: '66996' } }),
                buildCompanyOrderNodeWith({ node: { orderId: '66986' } }),
              ],
            },
          },
        }),
      );

    renderWithProviders(<MyOrders />, { preloadedState });

    await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

    expect(screen.getByRole('row', { name: /66996/ })).toBeInTheDocument();
    expect(screen.getByRole('row', { name: /66986/ })).toBeInTheDocument();
  });

  it('displays all the information associated with an order', async () => {
    const order66996 = buildCompanyOrderNodeWith({
      node: {
        orderId: '66996',
        poNumber: '0022',
        totalIncTax: 100,
        status: 'Pending',
        createdAt: getUnixTime(new Date('13 March 2025')),
        companyInfo: {
          companyName: 'Monsters Inc.',
        },
      },
    });

    const getAllOrders = vi.fn();

    server.use(
      graphql.query('GetOrderStatuses', () => {
        return HttpResponse.json(
          buildCompanyOrderStatusesWith({
            data: {
              orderStatuses: [
                buildOrderStatusWith({ systemLabel: 'Pending', customLabel: 'Pending' }),
                buildOrderStatusWith('WHATEVER_VALUES'),
              ],
            },
          }),
        );
      }),
      graphql.query('GetAllOrders', ({ query }) => HttpResponse.json(getAllOrders(query))),
    );

    when(getAllOrders)
      .calledWith(stringContainingAll('companyIds: [433,]', 'orderBy: "-bcOrderId"'))
      .thenReturn(
        buildCompanyOrdersWith({
          data: {
            allOrders: {
              totalCount: 1,
              edges: [order66996],
            },
          },
        }),
      );

    renderWithProviders(<MyOrders />, { preloadedState });

    await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

    const row = screen.getByRole('row', { name: /66996/ });

    expect(within(row).getByRole('cell', { name: '66996' })).toBeInTheDocument();
    expect(within(row).getByRole('cell', { name: 'Monsters Inc.' })).toBeInTheDocument();
    expect(within(row).getByRole('cell', { name: '0022' })).toBeInTheDocument();
    expect(within(row).getByRole('cell', { name: '$100.00' })).toBeInTheDocument();
    expect(within(row).getByRole('cell', { name: 'Pending' })).toBeInTheDocument();
    expect(within(row).getByRole('cell', { name: '13 March 2025' })).toBeInTheDocument();
  });
});

describe.todo('when a customer is part of a company hierarchy');
