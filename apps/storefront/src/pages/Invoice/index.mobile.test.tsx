import {
  buildCompanyStateWith,
  builder,
  buildStoreInfoStateWith,
  bulk,
  faker,
  getUnixTime,
  graphql,
  http,
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

import { permissionLevels } from '@/constants';

import { InvoiceStatusCode } from './components/InvoiceStatus';
import { triggerPdfDownload } from './components/triggerPdfDownload';
import Invoice from './index';

vi.mock('./components/triggerPdfDownload');

const { server } = startMockServer();

const buildInvoicePaymentNodeWith = builder(() => ({
  node: {
    id: faker.number.int().toString(),
    paymentType: faker.lorem.words(3),
    invoiceId: faker.number.int(),
    amount: {
      code: faker.finance.currencyCode(),
      value: faker.commerce.price(),
    },
    transactionType: faker.lorem.word(),
    referenceNumber: '',
    createdAt: faker.date.past(),
  },
}));

const buildInvoicePaymentHistoryResponseWith = builder(() => {
  const totalCount = faker.number.int({ min: 1, max: 5 });

  return {
    data: {
      allReceiptLines: {
        totalCount,
        edges: bulk(buildInvoicePaymentNodeWith, 'WHATEVER_VALUES').times(totalCount),
      },
    },
  };
});

const buildInvoiceWith = builder(() => ({
  node: {
    id: faker.number.int().toString(),
    invoiceNumber: faker.number.int().toString(),
    orderNumber: faker.number.int().toString(),
    createdAt: getUnixTime(faker.date.past()),
    dueDate: getUnixTime(faker.helpers.arrayElement([faker.date.recent(), faker.date.future()])),
    status: faker.helpers.enumValue(InvoiceStatusCode),
    openBalance: {
      code: faker.finance.currencyCode(),
      value: faker.number.int(),
    },
    originalBalance: {
      code: faker.finance.currencyCode(),
      value: faker.number.int(),
    },
    companyInfo: {
      companyId: faker.number.int().toString(),
      companyName: faker.company.name(),
    },
    orderUserId: faker.number.int(),
  },
}));

export const buildInvoicesResponseWith = builder(() => {
  const numberOfInvoices = faker.number.int({ min: 1, max: 10 });

  return {
    data: {
      invoices: {
        totalCount: numberOfInvoices,
        edges: bulk(buildInvoiceWith, 'WHATEVER_VALUES').times(numberOfInvoices),
        pageInfo: {
          hasNextPage: faker.datatype.boolean(),
          hasPreviousPage: faker.datatype.boolean(),
          startCursor: faker.string.uuid(),
          endCursor: faker.string.uuid(),
        },
      },
    },
  };
});

const buildInvoiceStatsResponseWith = builder(() => ({
  data: {
    invoiceStats: {
      totalBalance: faker.number.int(),
      overDueBalance: faker.number.int(),
    },
  },
}));

const companyStateWithPurchasePermissions = buildCompanyStateWith({
  customer: {
    id: 9988,
    b2bId: 8833,
    emailAddress: faker.internet.email(),
  },
  companyInfo: {
    id: faker.number.int().toString(),
  },
  permissions: [
    { code: 'purchase_enable', permissionLevel: permissionLevels.USER },
    { code: 'pay_invoice', permissionLevel: permissionLevels.USER },
    { code: 'get_orders', permissionLevel: permissionLevels.USER },
  ],
});

const storeInfoWithDateFormat = buildStoreInfoStateWith({ timeFormat: { display: 'j F Y' } });
const preloadedState = {
  storeInfo: storeInfoWithDateFormat,
  company: companyStateWithPurchasePermissions,
};

beforeEach(() => {
  window.location.assign('/invoice');

  vi.spyOn(document.body, 'clientWidth', 'get').mockReturnValue(500);

  window.URL.createObjectURL = vi.fn();
});

it('renders all invoices in the table', async () => {
  server.use(
    graphql.query('GetInvoices', () =>
      HttpResponse.json(
        buildInvoicesResponseWith({
          data: {
            invoices: {
              edges: bulk(buildInvoiceWith, 'WHATEVER_VALUES').times(10),
            },
          },
        }),
      ),
    ),
    graphql.query('GetInvoiceStats', () =>
      HttpResponse.json(buildInvoiceStatsResponseWith('WHATEVER_VALUES')),
    ),
  );

  renderWithProviders(<Invoice />, { preloadedState });

  await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

  const dates = screen.getAllByText('Invoice date:');

  expect(dates).toHaveLength(10);
});

it('renders invoice information in the table', async () => {
  server.use(
    graphql.query('GetInvoices', () =>
      HttpResponse.json(
        buildInvoicesResponseWith({
          data: {
            invoices: {
              edges: [
                buildInvoiceWith({
                  node: {
                    id: '4344',
                    orderNumber: '1234',
                    status: InvoiceStatusCode.PartiallyPaid,
                    createdAt: getUnixTime(new Date('13 March 2025')),
                    dueDate: getUnixTime(new Date('13 October 2025')),
                    originalBalance: { code: 'USD', value: 922 },
                    openBalance: { code: 'USD', value: 433 },
                    companyInfo: {
                      companyName: 'Monsters Inc.',
                    },
                  },
                }),
              ],
            },
          },
        }),
      ),
    ),
    graphql.query('GetInvoiceStats', () =>
      HttpResponse.json(buildInvoiceStatsResponseWith('WHATEVER_VALUES')),
    ),
  );

  renderWithProviders(<Invoice />, { preloadedState });

  await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

  const group = screen.getByRole('group', { name: '4344' });

  expect(within(group).getByRole('heading', { name: '4344' })).toBeInTheDocument();
  expect(within(group).getByText('1234')).toBeInTheDocument();
  expect(within(group).getByText('13 March 2025')).toBeInTheDocument();
  expect(within(group).getByText('13 October 2025')).toBeInTheDocument();
  expect(within(group).getByText('$922.00')).toBeInTheDocument();
  expect(within(group).getByText('$433.00')).toBeInTheDocument();

  expect(within(group).getByRole('button', { name: 'More actions' })).toBeInTheDocument();
});

it('can pay for multiple invoices', async () => {
  const getCreateCartResponse = vi.fn();
  const getCheckoutLoginResponse = vi.fn();

  server.use(
    graphql.query('GetInvoices', () =>
      HttpResponse.json(
        buildInvoicesResponseWith({
          data: {
            invoices: {
              edges: [
                buildInvoiceWith({
                  node: {
                    id: '3344',
                    status: InvoiceStatusCode.PartiallyPaid,
                    originalBalance: { code: 'USD', value: 922 },
                    openBalance: { code: 'USD', value: 433 },
                    companyInfo: { companyId: preloadedState.company.companyInfo.id },
                  },
                }),
                buildInvoiceWith({
                  node: {
                    id: '3345',
                    invoiceNumber: '3325',
                    status: InvoiceStatusCode.PartiallyPaid,
                    originalBalance: { code: 'USD', value: 444 },
                    openBalance: { code: 'USD', value: 232 },
                    companyInfo: { companyId: preloadedState.company.companyInfo.id },
                  },
                }),
              ],
            },
          },
        }),
      ),
    ),
    graphql.query('GetInvoiceStats', () =>
      HttpResponse.json(buildInvoiceStatsResponseWith('WHATEVER_VALUES')),
    ),
    graphql.mutation('CreateCart', ({ query }) => HttpResponse.json(getCreateCartResponse(query))),
    graphql.mutation('checkoutLogin', ({ variables }) =>
      HttpResponse.json(getCheckoutLoginResponse(variables)),
    ),
  );

  when(getCreateCartResponse)
    .calledWith(
      stringContainingAll(
        'invoiceId: 3344, amount: "433"',
        'invoiceId: 3345, amount: "232"',
        'currency: "USD"',
      ),
    )
    .thenReturn({
      data: {
        invoiceCreateBcCart: {
          result: { cartId: 'foo-bar', checkoutUrl: faker.internet.url() },
        },
      },
    });

  when(getCheckoutLoginResponse)
    .calledWith({ cartData: { cartId: 'foo-bar' } })
    .thenReturn({
      data: {
        checkoutLogin: { result: { redirectUrl: 'https://example.com/checkout?cartId=foo-bar' } },
      },
    });

  renderWithProviders(<Invoice />, { preloadedState });

  await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

  const group3344 = screen.getByRole('group', { name: '3344' });
  const group3345 = screen.getByRole('group', { name: '3345' });

  await userEvent.click(within(group3344).getByRole('checkbox'));
  await userEvent.click(within(group3345).getByRole('checkbox'));

  expect(screen.getByText('2 invoices selected')).toBeInTheDocument();

  expect(screen.getByRole('heading', { name: 'Total payment: $665.00' })).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: 'Pay invoices' }));

  await waitFor(() => {
    expect(window.location.href).toEqual('https://example.com/checkout?cartId=foo-bar');
  });
});

it('can specify an amount to pay for the invoices', async () => {
  const getCreateCartResponse = vi.fn();
  const getCheckoutLoginResponse = vi.fn();

  server.use(
    graphql.query('GetInvoices', () =>
      HttpResponse.json(
        buildInvoicesResponseWith({
          data: {
            invoices: {
              edges: [
                buildInvoiceWith({
                  node: {
                    id: '3344',
                    status: InvoiceStatusCode.PartiallyPaid,
                    originalBalance: { code: 'USD', value: 922 },
                    openBalance: { code: 'USD', value: 433 },
                    companyInfo: {
                      companyId: preloadedState.company.companyInfo.id,
                    },
                  },
                }),
              ],
            },
          },
        }),
      ),
    ),
    graphql.query('GetInvoiceStats', () =>
      HttpResponse.json(buildInvoiceStatsResponseWith('WHATEVER_VALUES')),
    ),
    graphql.mutation('CreateCart', ({ query }) => HttpResponse.json(getCreateCartResponse(query))),
    graphql.mutation('checkoutLogin', ({ variables }) =>
      HttpResponse.json(getCheckoutLoginResponse(variables)),
    ),
  );

  when(getCreateCartResponse)
    .calledWith(stringContainingAll('invoiceId: 3344, amount: "2"', 'currency: "USD"'))
    .thenReturn({
      data: {
        invoiceCreateBcCart: {
          result: { cartId: 'foo-bar', checkoutUrl: faker.internet.url() },
        },
      },
    });

  when(getCheckoutLoginResponse)
    .calledWith({ cartData: { cartId: 'foo-bar' } })
    .thenReturn({
      data: {
        checkoutLogin: { result: { redirectUrl: 'https://example.com/checkout?cartId=foo-bar' } },
      },
    });

  renderWithProviders(<Invoice />, { preloadedState });

  await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

  await userEvent.click(screen.getByRole('checkbox'));

  const amountToPay = screen.getByRole('spinbutton');

  await userEvent.type(amountToPay, '2', {
    initialSelectionStart: 0,
    initialSelectionEnd: Infinity,
  });

  expect(screen.getByRole('heading', { name: 'Total payment: $2.00' })).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: 'Pay invoices' }));

  await waitFor(() => {
    expect(window.location.href).toEqual('https://example.com/checkout?cartId=foo-bar');
  });
});

it('navigates to the order details page when clicking on the order number', async () => {
  server.use(
    graphql.query('GetInvoices', () =>
      HttpResponse.json(
        buildInvoicesResponseWith({
          data: {
            invoices: {
              edges: [
                buildInvoiceWith({
                  node: { id: '3344', orderNumber: '4444' },
                }),
              ],
            },
          },
        }),
      ),
    ),
    graphql.query('GetInvoiceStats', () =>
      HttpResponse.json(buildInvoiceStatsResponseWith('WHATEVER_VALUES')),
    ),
  );

  const { navigation } = renderWithProviders(<Invoice />, { preloadedState });

  await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

  const orderButton = screen.getByRole('button', { name: '4444' });

  await userEvent.click(orderButton);

  expect(navigation).toHaveBeenCalledWith('/orderDetail/4444');
});

it('shows the current open/overdue values at the header', async () => {
  server.use(
    graphql.query('GetInvoices', () =>
      HttpResponse.json(buildInvoicesResponseWith('WHATEVER_VALUES')),
    ),
    graphql.query('GetInvoiceStats', () =>
      HttpResponse.json(
        buildInvoiceStatsResponseWith({
          data: {
            invoiceStats: {
              totalBalance: 1000,
              overDueBalance: 200,
            },
          },
        }),
      ),
    ),
  );

  renderWithProviders(<Invoice />, { preloadedState });

  const openBalance = await screen.findByText('Open: $1,000.00');
  const overdueBalance = await screen.findByText('Overdue: $200.00');

  expect(openBalance).toBeInTheDocument();
  expect(overdueBalance).toBeInTheDocument();
});

it('opens the invoice in a new window when clicking on the invoice number', async () => {
  const pdfFile = new Blob(['%PDF-1.4 Mock PDF Content'], { type: 'application/pdf' });

  const getInvoicePDFUrlResponse = vi.fn();

  server.use(
    graphql.query('GetInvoices', () =>
      HttpResponse.json(
        buildInvoicesResponseWith({
          data: {
            invoices: {
              edges: [buildInvoiceWith({ node: { id: '3344' } })],
            },
          },
        }),
      ),
    ),
    graphql.query('GetInvoiceStats', () =>
      HttpResponse.json(buildInvoiceStatsResponseWith('WHATEVER_VALUES')),
    ),
    graphql.mutation('GetInvoicePDFUrl', ({ query }) =>
      HttpResponse.json(getInvoicePDFUrlResponse(query)),
    ),
    http.get('https://example.com/invoice.pdf', async () =>
      HttpResponse.arrayBuffer(await pdfFile.arrayBuffer(), {
        headers: { 'Content-Type': 'application/pdf' },
      }),
    ),
  );

  when(getInvoicePDFUrlResponse)
    .calledWith(stringContainingAll('invoiceId: 3344'))
    .thenReturn({ data: { invoicePdf: { url: 'https://example.com/invoice.pdf' } } });

  renderWithProviders(<Invoice />, { preloadedState });

  await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

  vi.spyOn(window, 'open').mockImplementation(vi.fn());

  const invoiceLink = screen.getByRole('button', { name: '3344' });

  when(window.URL.createObjectURL)
    .calledWith(pdfFile)
    .thenReturn('https://localhost:3000/mock-blob-url');

  await userEvent.click(invoiceLink);

  await waitFor(() => {
    expect(window.open).toHaveBeenCalledWith(
      'https://localhost:3000/mock-blob-url',
      '_blank',
      'fullscreen=yes',
    );
  });
});

describe('when using the action menu', () => {
  it('opens the invoice in a new window', async () => {
    const pdfFile = new Blob(['%PDF-1.4 Mock PDF Content'], { type: 'application/pdf' });

    const getInvoicePDFUrlResponse = vi.fn();

    server.use(
      graphql.query('GetInvoices', () =>
        HttpResponse.json(
          buildInvoicesResponseWith({
            data: {
              invoices: {
                edges: [buildInvoiceWith({ node: { id: '3344' } })],
              },
            },
          }),
        ),
      ),
      graphql.query('GetInvoiceStats', () =>
        HttpResponse.json(buildInvoiceStatsResponseWith('WHATEVER_VALUES')),
      ),
      graphql.mutation('GetInvoicePDFUrl', ({ query }) =>
        HttpResponse.json(getInvoicePDFUrlResponse(query)),
      ),
      http.get('https://example.com/invoice.pdf', async () =>
        HttpResponse.arrayBuffer(await pdfFile.arrayBuffer(), {
          headers: { 'Content-Type': 'application/pdf' },
        }),
      ),
    );

    when(getInvoicePDFUrlResponse)
      .calledWith(stringContainingAll('invoiceId: 3344'))
      .thenReturn({ data: { invoicePdf: { url: 'https://example.com/invoice.pdf' } } });

    vi.spyOn(window, 'open').mockImplementation(vi.fn());

    when(window.URL.createObjectURL)
      .calledWith(pdfFile)
      .thenReturn('https://localhost:3000/mock-blob-url');

    renderWithProviders(<Invoice />, { preloadedState });

    await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

    const group = screen.getByRole('group', { name: '3344' });

    const moreActionsButton = within(group).getByRole('button', { name: 'More actions' });

    await userEvent.click(moreActionsButton);

    await userEvent.click(screen.getByRole('menuitem', { name: 'View invoice' }));

    await waitFor(() => {
      expect(window.open).toHaveBeenCalledWith(
        'https://localhost:3000/mock-blob-url',
        '_blank',
        'fullscreen=yes',
      );
    });
  });

  it('navigates to the order details page when view order', async () => {
    server.use(
      graphql.query('GetInvoices', () =>
        HttpResponse.json(
          buildInvoicesResponseWith({
            data: {
              invoices: {
                edges: [
                  buildInvoiceWith({
                    node: {
                      id: '3344',
                      orderNumber: '4444',
                      orderUserId: preloadedState.company.customer.id,
                    },
                  }),
                ],
              },
            },
          }),
        ),
      ),
      graphql.query('GetInvoiceStats', () =>
        HttpResponse.json(buildInvoiceStatsResponseWith('WHATEVER_VALUES')),
      ),
    );

    const { navigation } = renderWithProviders(<Invoice />, { preloadedState });

    await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

    const group = screen.getByRole('group', { name: '3344' });

    const moreActionsButton = within(group).getByRole('button', { name: 'More actions' });

    await userEvent.click(moreActionsButton);

    await userEvent.click(screen.getByRole('menuitem', { name: 'View order' }));

    expect(navigation).toHaveBeenCalledWith('/orderDetail/4444');
  });

  it('downloads an invoice', async () => {
    const getInvoicePDFUrlResponse = vi.fn();

    server.use(
      graphql.query('GetInvoices', () =>
        HttpResponse.json(
          buildInvoicesResponseWith({
            data: {
              invoices: {
                edges: [buildInvoiceWith({ node: { id: '3344' } })],
              },
            },
          }),
        ),
      ),
      graphql.query('GetInvoiceStats', () =>
        HttpResponse.json(buildInvoiceStatsResponseWith('WHATEVER_VALUES')),
      ),
      graphql.mutation('GetInvoicePDFUrl', ({ query }) =>
        HttpResponse.json(getInvoicePDFUrlResponse(query)),
      ),
    );

    when(getInvoicePDFUrlResponse)
      .calledWith(stringContainingAll('invoiceId: 3344'))
      .thenReturn({ data: { invoicePdf: { url: 'https://example.com/invoice.pdf' } } });

    renderWithProviders(<Invoice />, { preloadedState });

    await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

    const group = screen.getByRole('group', { name: '3344' });

    const moreActionsButton = within(group).getByRole('button', { name: 'More actions' });

    await userEvent.click(moreActionsButton);

    await userEvent.click(screen.getByRole('menuitem', { name: 'Download' }));

    expect(triggerPdfDownload).toHaveBeenCalledWith('https://example.com/invoice.pdf', 'file.pdf');
  });

  it('prints an invoice', async () => {
    const pdfFile = new Blob(['%PDF-1.4 Mock PDF Content'], { type: 'application/pdf' });
    const getInvoicePDFUrlResponse = vi.fn();

    server.use(
      graphql.query('GetInvoices', () =>
        HttpResponse.json(
          buildInvoicesResponseWith({
            data: {
              invoices: {
                edges: [buildInvoiceWith({ node: { id: '3344' } })],
              },
            },
          }),
        ),
      ),
      graphql.query('GetInvoiceStats', () =>
        HttpResponse.json(buildInvoiceStatsResponseWith('WHATEVER_VALUES')),
      ),
      graphql.mutation('GetInvoicePDFUrl', ({ query }) =>
        HttpResponse.json(getInvoicePDFUrlResponse(query)),
      ),
      http.get('https://example.com/invoice.pdf', async () =>
        HttpResponse.arrayBuffer(await pdfFile.arrayBuffer(), {
          headers: { 'Content-Type': 'application/pdf' },
        }),
      ),
    );

    vi.spyOn(window, 'open').mockImplementation(vi.fn());

    when(window.URL.createObjectURL)
      .calledWith(pdfFile)
      .thenReturn('https://localhost:3000/mock-blob-url');

    when(getInvoicePDFUrlResponse)
      .calledWith(stringContainingAll('invoiceId: 3344'))
      .thenReturn({ data: { invoicePdf: { url: 'https://example.com/invoice.pdf' } } });

    renderWithProviders(<Invoice />, { preloadedState });

    await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

    const group = screen.getByRole('group', { name: '3344' });

    const moreActionsButton = within(group).getByRole('button', { name: 'More actions' });

    await userEvent.click(moreActionsButton);

    await userEvent.click(screen.getByRole('menuitem', { name: 'Print' }));

    await waitFor(() => {
      expect(window.open).toHaveBeenCalledWith(
        'https://localhost:3000/mock-blob-url',
        '_blank',
        'fullscreen=yes',
      );
    });
  });

  it('does not show payment history if status is Open', async () => {
    server.use(
      graphql.query('GetInvoices', () =>
        HttpResponse.json(
          buildInvoicesResponseWith({
            data: {
              invoices: {
                edges: [buildInvoiceWith({ node: { id: '3344', status: InvoiceStatusCode.Open } })],
              },
            },
          }),
        ),
      ),
      graphql.query('GetInvoiceStats', () =>
        HttpResponse.json(buildInvoiceStatsResponseWith('WHATEVER_VALUES')),
      ),
    );

    renderWithProviders(<Invoice />, { preloadedState });

    await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

    const group = screen.getByRole('group', { name: '3344' });

    const moreActionsButton = within(group).getByRole('button', { name: 'More actions' });

    await userEvent.click(moreActionsButton);

    expect(
      screen.queryByRole('menuitem', { name: 'View payment history' }),
    ).not.toBeInTheDocument();
  });

  it('opens the payment history dialog', async () => {
    const getInvoicePaymentHistory = vi.fn();

    server.use(
      graphql.query('GetInvoices', () =>
        HttpResponse.json(
          buildInvoicesResponseWith({
            data: {
              invoices: {
                edges: [buildInvoiceWith({ node: { id: '3344', status: InvoiceStatusCode.Paid } })],
              },
            },
          }),
        ),
      ),
      graphql.query('GetInvoiceStats', () =>
        HttpResponse.json(buildInvoiceStatsResponseWith('WHATEVER_VALUES')),
      ),
      graphql.query('GetInvoicePaymentHistory', ({ query }) =>
        HttpResponse.json(getInvoicePaymentHistory(query)),
      ),
    );

    when(getInvoicePaymentHistory)
      .calledWith(stringContainingAll('invoiceId: "3344"'))
      .thenReturn(
        buildInvoicePaymentHistoryResponseWith({
          data: {
            allReceiptLines: {
              totalCount: 2,
              edges: [
                buildInvoicePaymentNodeWith({
                  node: {
                    createdAt: getUnixTime(new Date('23 July 2025')),
                    amount: { code: 'USD', value: '50.5' },
                    referenceNumber: '1234',
                    paymentType: 'visa ending in 1111',
                    transactionType: 'Foo Bar',
                  },
                }),
                buildInvoicePaymentNodeWith({
                  node: {
                    createdAt: getUnixTime(new Date('14 July 2025')),
                    amount: { code: 'USD', value: '30.5' },
                    referenceNumber: '3222',
                    paymentType: 'visa ending in 1212',
                    transactionType: 'Bar Baz',
                  },
                }),
              ],
            },
          },
        }),
      );

    renderWithProviders(<Invoice />, { preloadedState });

    await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

    const group = screen.getByRole('group', { name: '3344' });

    const moreActionsButton = within(group).getByRole('button', { name: 'More actions' });

    await userEvent.click(moreActionsButton);

    await userEvent.click(screen.getByRole('menuitem', { name: 'View payment history' }));

    const dialog = await screen.findByRole('dialog', { name: 'Payments history' });

    expect(within(dialog).getByText('23 July 2025')).toBeInTheDocument();
    expect(within(dialog).getByText('Foo Bar')).toBeInTheDocument();
    expect(within(dialog).getByText('visa ending in 1111')).toBeInTheDocument();
    expect(within(dialog).getByText('1234')).toBeInTheDocument();
    expect(within(dialog).getByText('$50.50')).toBeInTheDocument();

    expect(within(dialog).getByText('14 July 2025')).toBeInTheDocument();
    expect(within(dialog).getByText('Bar Baz')).toBeInTheDocument();
    expect(within(dialog).getByText('visa ending in 1212')).toBeInTheDocument();
    expect(within(dialog).getByText('3222')).toBeInTheDocument();
    expect(within(dialog).getByText('$30.50')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'ok' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Payments history' })).not.toBeInTheDocument();
    });
  });

  it('navigates to checkout to pay for the invoice', async () => {
    const getCreateCartResponse = vi.fn();
    const getCheckoutLoginResponse = vi.fn();

    server.use(
      graphql.query('GetInvoices', () =>
        HttpResponse.json(
          buildInvoicesResponseWith({
            data: {
              invoices: {
                edges: [
                  buildInvoiceWith({
                    node: {
                      id: '3344',
                      status: InvoiceStatusCode.PartiallyPaid,
                      originalBalance: { code: 'USD', value: 922 },
                      openBalance: { code: 'USD', value: 433 },
                      companyInfo: {
                        companyId: preloadedState.company.companyInfo.id,
                      },
                    },
                  }),
                ],
              },
            },
          }),
        ),
      ),
      graphql.query('GetInvoiceStats', () =>
        HttpResponse.json(buildInvoiceStatsResponseWith('WHATEVER_VALUES')),
      ),
      graphql.mutation('CreateCart', ({ query }) =>
        HttpResponse.json(getCreateCartResponse(query)),
      ),
      graphql.mutation('checkoutLogin', ({ variables }) =>
        HttpResponse.json(getCheckoutLoginResponse(variables)),
      ),
    );

    when(getCreateCartResponse)
      .calledWith(stringContainingAll('invoiceId: 3344, amount: "433"', 'currency: "USD"'))
      .thenReturn({
        data: {
          invoiceCreateBcCart: {
            result: { cartId: 'foo-bar', checkoutUrl: faker.internet.url() },
          },
        },
      });

    when(getCheckoutLoginResponse)
      .calledWith({ cartData: { cartId: 'foo-bar' } })
      .thenReturn({
        data: {
          checkoutLogin: { result: { redirectUrl: 'https://example.com/checkout?cartId=foo-bar' } },
        },
      });

    renderWithProviders(<Invoice />, { preloadedState });

    await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

    const group = screen.getByRole('group', { name: '3344' });

    const moreActionsButton = within(group).getByRole('button', { name: 'More actions' });

    await userEvent.click(moreActionsButton);

    await userEvent.click(screen.getByRole('menuitem', { name: 'Pay' }));

    await waitFor(() => {
      expect(window.location.href).toEqual('https://example.com/checkout?cartId=foo-bar');
    });
  });

  it('does not show the pay button if balance is 0', async () => {
    server.use(
      graphql.query('GetInvoices', () =>
        HttpResponse.json(
          buildInvoicesResponseWith({
            data: {
              invoices: {
                edges: [
                  buildInvoiceWith({
                    node: {
                      id: '3344',
                      originalBalance: { code: 'USD', value: 922 },
                      openBalance: { code: 'USD', value: 0 },
                    },
                  }),
                ],
              },
            },
          }),
        ),
      ),
      graphql.query('GetInvoiceStats', () =>
        HttpResponse.json(buildInvoiceStatsResponseWith('WHATEVER_VALUES')),
      ),
    );

    renderWithProviders(<Invoice />, { preloadedState });

    await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

    const group = screen.getByRole('group', { name: '3344' });

    const moreActionsButton = within(group).getByRole('button', { name: 'More actions' });

    await userEvent.click(moreActionsButton);

    expect(screen.queryByRole('menuitem', { name: 'Pay' })).not.toBeInTheDocument();
  });
});
