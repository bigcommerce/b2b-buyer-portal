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

import { CompanyStatus, CustomerRole, UserTypes } from '@/types';

import {
  CompanyOrderNode,
  CompanyOrderStatuses,
  GetCompanyOrders,
  OrderStatus,
} from '../order/orders';

import MyOrders from '.';

const { server } = startMockServer();

const buildOrderStatusWith = builder<OrderStatus>(() => ({
  statusCode: faker.number.int().toString(),
  systemLabel: faker.word.noun(),
  customLabel: faker.word.noun(),
}));

beforeEach(() => {
  vi.spyOn(document.body, 'clientWidth', 'get').mockReturnValue(500);
});

const buildCompanyOrderNodeWith = builder<CompanyOrderNode>(() => ({
  node: {
    orderId: faker.number.int().toString(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    createdAt: getUnixTime(faker.date.past()),
    totalIncTax: faker.number.float(),
    poNumber: faker.number.int().toString(),
    status: faker.word.noun(),
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
  it('displays all the orders associated with the customer', async () => {
    server.use(
      graphql.query('GetAllOrders', () =>
        HttpResponse.json(
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
        ),
      ),
    );

    renderWithProviders(<MyOrders />, { preloadedState });

    await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

    expect(screen.getByRole('heading', { name: /66996/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /66986/ })).toBeInTheDocument();
  });

  it('displays all the information associated with an order', async () => {
    const order66996 = buildCompanyOrderNodeWith({
      node: {
        orderId: '66996',
        poNumber: '0022',
        totalIncTax: 100,
        status: 'Pending',
        createdAt: getUnixTime(new Date('13 March 2025')),
        firstName: 'Mike',
        lastName: 'Wazowski',
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

    expect(screen.getByRole('heading', { name: '# 66996' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '$100.00' })).toBeInTheDocument();

    // TODO: Add company name to the UI
    // expect(screen.getByText('Monsters Inc.')).toBeInTheDocument();

    expect(screen.getByText('0022')).toBeInTheDocument();
    expect(screen.getByText('by Mike Wazowski')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('13 March 2025')).toBeInTheDocument();
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

    // The character U+2013 "–" could be confused with the ASCII character U+002d "-", which is more common in source code.
    expect(screen.getByText('–')).toBeInTheDocument();
  });

  it.todo('formats the total price based on the money property', async () => {
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

    expect(screen.getByRole('cell', { name: '1.000,0€' })).toBeInTheDocument();
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

    await userEvent.click(screen.getByRole('combobox', { name: /per page/ }));
    await userEvent.click(screen.getByRole('option', { name: '20' }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /66996/ })).toBeInTheDocument();
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
      expect(screen.getByRole('heading', { name: /66996/ })).toBeInTheDocument();
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
      expect(screen.getByRole('heading', { name: /66996/ })).toBeInTheDocument();
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
      expect(screen.getByRole('heading', { name: /66996/ })).toBeInTheDocument();
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
                buildOrderStatusWith('WHATEVER_VALUES'),
              ],
            },
          }),
        ),
      ),
      graphql.query('GetOrdersCreatedByUser', () =>
        HttpResponse.json({ data: { createdByUser: { results: [] } } }),
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

    await userEvent.click(within(dialog).getByRole('combobox', { name: 'Order status' }));

    await userEvent.click(screen.getByRole('option', { name: 'Pending' }));

    await userEvent.click(screen.getByRole('textbox', { name: 'From' }));
    await userEvent.click(screen.getByRole('gridcell', { name: /15/ }));

    await userEvent.click(screen.getByRole('textbox', { name: 'To' }));
    await userEvent.click(screen.getByRole('gridcell', { name: /26/ }));

    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /66996/ })).toBeInTheDocument();
    });
  });

  it('can filter orders based on dates', async () => {
    vi.setSystemTime(new Date('21 November 2022'));

    const getOrders = vi.fn().mockReturnValue(buildCompanyOrdersWith('WHATEVER_VALUES'));

    server.use(
      graphql.query('GetAllOrders', ({ query }) => HttpResponse.json(getOrders(query))),
      graphql.query('GetOrdersCreatedByUser', () =>
        HttpResponse.json({ data: { createdByUser: { results: [] } } }),
      ),
    );

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
      expect(screen.getByRole('heading', { name: /66996/ })).toBeInTheDocument();
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
      graphql.query('GetOrdersCreatedByUser', () =>
        HttpResponse.json({ data: { createdByUser: { results: [] } } }),
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

    await userEvent.click(within(dialog).getByRole('combobox', { name: 'Order status' }));

    await userEvent.click(screen.getByRole('option', { name: 'Awaiting' }));

    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /66996/ })).toBeInTheDocument();
    });
  });

  it('navigates to the order details page when clicking on an element', async () => {
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

    const heading = screen.getByRole('heading', { name: /66996/ });

    await userEvent.click(heading);

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

describe('when a super admin is masquerading as a company customer', () => {
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

  it('displays all the orders associated with the company', async () => {
    const getAllOrders = vi.fn();

    server.use(
      graphql.query('GetAllOrders', ({ query }) => HttpResponse.json(getAllOrders(query))),
    );

    when(getAllOrders)
      .calledWith(
        // isShowMy controls whether to show the orders for the current user, setting it to "0" will get all the orders for a company.
        stringContainingAll('companyIds: [433,]', 'isShowMy: "0"', 'orderBy: "-bcOrderId"'),
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

    expect(screen.getByRole('heading', { name: '# 66996' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '# 66986' })).toBeInTheDocument();
  });

  it('displays all the information associated with an order', async () => {
    const order66996 = buildCompanyOrderNodeWith({
      node: {
        orderId: '66996',
        firstName: 'Mike',
        lastName: 'Wazowski',
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

    expect(screen.getByRole('heading', { name: '# 66996' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '$100.00' })).toBeInTheDocument();

    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('13 March 2025')).toBeInTheDocument();
    expect(screen.getByText('by Mike Wazowski')).toBeInTheDocument();
  });
});

describe.todo('when a customer is part of a company hierarchy');
