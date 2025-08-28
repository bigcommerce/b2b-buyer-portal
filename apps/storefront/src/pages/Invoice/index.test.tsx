import { when } from 'vitest-when';

import { permissionLevels } from '@/constants';
import {
  buildCompanyStateWith,
  builder,
  buildGlobalStateWith,
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

import { InvoiceStatusCode } from './components/InvoiceStatus';
import { triggerPdfDownload } from './components/triggerPdfDownload';

import Invoice from '.';

const { server } = startMockServer();

vi.mock('./components/triggerPdfDownload');

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

const buildReceiptLineNodeWith = builder(() => ({
  node: {
    id: faker.number.int().toString(),
    invoiceNumber: faker.number.int().toString(),
    amount: {
      code: faker.finance.currencyCode(),
      value: faker.commerce.price(),
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

  window.URL.createObjectURL = vi.fn();
});

it('renders every column', async () => {
  server.use(
    graphql.query('GetInvoices', () =>
      HttpResponse.json(buildInvoicesResponseWith('WHATEVER_VALUES')),
    ),
    graphql.query('GetInvoiceStats', () =>
      HttpResponse.json(buildInvoiceStatsResponseWith('WHATEVER_VALUES')),
    ),
  );

  renderWithProviders(<Invoice />, { preloadedState });

  await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

  const table = screen.getByRole('table');

  const columnHeaders = within(table).getAllByRole('columnheader');

  expect(columnHeaders).toHaveLength(12);

  expect(within(columnHeaders[0]).getByRole('checkbox')).not.toBeChecked();

  expect(columnHeaders[1]).toBeEmptyDOMElement(); // contains the checkboxes

  expect(columnHeaders[2]).toHaveTextContent('Invoices');
  expect(columnHeaders[3]).toHaveTextContent('Company');
  expect(columnHeaders[4]).toHaveTextContent('Order');
  expect(columnHeaders[5]).toHaveTextContent('Invoice date');
  expect(columnHeaders[6]).toHaveTextContent('Due date');
  expect(columnHeaders[7]).toHaveTextContent('Invoice total');
  expect(columnHeaders[8]).toHaveTextContent('Amount due');
  expect(columnHeaders[9]).toHaveTextContent('Amount to pay');
  expect(columnHeaders[10]).toHaveTextContent('Status');
  expect(columnHeaders[11]).toHaveTextContent('Action');
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

  const table = screen.getByRole('table');

  const rows = within(table).getAllByRole('row');

  // for each invoice, we render a normal row with the information
  // and a collapsed row to show the invoice's PDF
  expect(rows).toHaveLength(21);
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
                    invoiceNumber: '3322',
                    orderNumber: '1234',
                    status: InvoiceStatusCode.PartiallyPaid,
                    createdAt: getUnixTime(new Date('13 March 2025')),
                    dueDate: getUnixTime(new Date('13 October 2025')),
                    originalBalance: { code: 'USD', value: 922 },
                    openBalance: { code: 'USD', value: 433 },
                    companyInfo: {
                      companyName: 'Monsters Inc.',
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
  );

  renderWithProviders(<Invoice />, { preloadedState });

  await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

  const row = screen.getByRole('row', { name: /3322/ });
  const cells = within(row).getAllByRole('cell');

  expect(cells[2]).toHaveTextContent('3322');
  expect(cells[3]).toHaveTextContent('Monsters Inc.');
  expect(cells[4]).toHaveTextContent('1234');
  expect(cells[5]).toHaveTextContent('13 March 2025');
  expect(cells[6]).toHaveTextContent('13 October 2025');
  expect(cells[7]).toHaveTextContent('$922.00');
  expect(cells[8]).toHaveTextContent('$433.00');

  // cell with an input to pay the invoice
  expect(cells[9]).toHaveTextContent('$');
  expect(within(cells[9]).getByRole('spinbutton')).toHaveValue(433);

  expect(cells[10]).toHaveTextContent('Partially paid');

  expect(within(row).getByRole('button', { name: 'More actions' })).toBeInTheDocument();
});

it('can pay for multiple invoices', async () => {
  const getCreateCartResponse = vi.fn().mockName('getCreateCartResponse');
  const getCheckoutLoginResponse = vi.fn().mockName('getCheckoutLoginResponse');

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
                    invoiceNumber: '3322',
                    status: InvoiceStatusCode.PartiallyPaid,
                    originalBalance: { code: 'USD', value: 922 },
                    openBalance: { code: 'USD', value: 433 },
                    companyInfo: {
                      companyId: preloadedState.company.companyInfo.id,
                    },
                  },
                }),
                buildInvoiceWith({
                  node: {
                    id: '3345',
                    invoiceNumber: '3325',
                    status: InvoiceStatusCode.PartiallyPaid,
                    originalBalance: { code: 'USD', value: 444 },
                    openBalance: { code: 'USD', value: 232 },
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

  const table = screen.getByRole('table');

  const firstRow = within(table).getByRole('row', { name: /3322/ });
  const firstRowCells = within(firstRow).getAllByRole('cell');

  const secondRow = within(table).getByRole('row', { name: /3325/ });
  const secondRowCells = within(secondRow).getAllByRole('cell');

  await userEvent.click(within(firstRowCells[0]).getByRole('checkbox'));

  expect(screen.getByText('1 invoices selected')).toBeInTheDocument();

  await userEvent.click(within(secondRowCells[0]).getByRole('checkbox'));

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
                    invoiceNumber: '3322',
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
    .calledWith(stringContainingAll('invoiceId: 3344', 'amount: "2"', 'currency: "USD"'))
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

  const row = screen.getByRole('row', { name: /3322/ });
  const cells = within(row).getAllByRole('cell');

  await userEvent.click(within(cells[0]).getByRole('checkbox'));

  const amountToPay = within(cells[9]).getByRole('spinbutton');

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
                  node: {
                    orderNumber: '4444',
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

it('opens the invoice in a new window when clicking on the invoice number', async () => {
  const pdfFile = new Blob(['%PDF-1.4 Mock PDF Content'], { type: 'application/pdf' });

  const getInvoicePDFUrlResponse = vi.fn();

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
                    invoiceNumber: '3322',
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

  const invoiceLink = screen.getByRole('button', { name: '3322' });

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

it('can expand an invoice to look at its details', async () => {
  const pdfFile = new Blob(['%PDF-1.4 Mock PDF Content'], { type: 'application/pdf' });

  const getInvoicePDFUrlResponse = vi.fn();

  server.use(
    graphql.query('GetInvoices', () =>
      HttpResponse.json(
        buildInvoicesResponseWith({
          data: {
            invoices: {
              edges: [buildInvoiceWith({ node: { id: '3344', invoiceNumber: '3322' } })],
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

  const row = screen.getByRole('row', { name: /3322/ });
  const expandRow = within(row).getByRole('button', { name: 'expand row' });

  when(window.URL.createObjectURL)
    .calledWith(pdfFile)
    .thenReturn('https://localhost:3000/mock-blob-url');

  const { log } = console;

  vi.spyOn(console, 'log').mockImplementation(log);

  // PDFObject will log a warning in the console if it cannot embed the PDF
  // eslint-disable-next-line no-console
  when(console.log).calledWith(stringContainingAll('[PDFObject]'), expect.anything()).thenReturn();

  await userEvent.click(expandRow);

  // JSDOM/Vitest do not support PDF inlining, so we check for the fallback link
  const link = await screen.findByRole('link', { name: 'Download PDF' });

  expect(link).toHaveAttribute('href', 'https://localhost:3000/mock-blob-url');
});

describe('when rendered in catalyst', () => {
  const global = buildGlobalStateWith({ storeInfo: { platform: 'catalyst' } });

  it('takes the user to checkout using the catalyst /checkout route', async () => {
    const getCreateCartResponse = vi.fn();

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
                      invoiceNumber: '3322',
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
    );

    when(getCreateCartResponse)
      .calledWith(stringContainingAll('invoiceId: 3344', 'amount: "433"', 'currency: "USD"'))
      .thenReturn({
        data: {
          invoiceCreateBcCart: {
            result: {
              cartId: 'foo-bar',
              checkoutUrl: 'https://testing.com/checkout?cartId=foo-bar',
            },
          },
        },
      });

    renderWithProviders(<Invoice />, { preloadedState: { ...preloadedState, global } });

    await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

    const row = screen.getByRole('row', { name: /3322/ });
    const cells = within(row).getAllByRole('cell');

    await userEvent.click(within(cells[0]).getByRole('checkbox'));

    expect(screen.getByText('1 invoices selected')).toBeInTheDocument();

    expect(screen.getByRole('heading', { name: 'Total payment: $433.00' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Pay invoices' }));

    await waitFor(() => {
      expect(window.location.href).toEqual('http://localhost/checkout?cartId=foo-bar');
    });
  });
});

describe('when rendered in stencil', () => {
  const global = buildGlobalStateWith({ storeInfo: { platform: 'bigcommerce' } });

  it('takes the user to checkout without a login link', async () => {
    const getCreateCartResponse = vi.fn();

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
                      invoiceNumber: '3322',
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
    );

    when(getCreateCartResponse)
      .calledWith(stringContainingAll('invoiceId: 3344', 'amount: "433"', 'currency: "USD"'))
      .thenReturn({
        data: {
          invoiceCreateBcCart: {
            result: {
              cartId: 'foo-bar',
              checkoutUrl: 'https://testing.com/checkout?cartId=foo-bar',
            },
          },
        },
      });

    renderWithProviders(<Invoice />, { preloadedState: { ...preloadedState, global } });

    await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

    const row = screen.getByRole('row', { name: /3322/ });
    const cells = within(row).getAllByRole('cell');

    await userEvent.click(within(cells[0]).getByRole('checkbox'));

    expect(screen.getByText('1 invoices selected')).toBeInTheDocument();

    expect(screen.getByRole('heading', { name: 'Total payment: $433.00' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Pay invoices' }));

    await waitFor(() => {
      expect(window.location.href).toEqual('https://testing.com/checkout?cartId=foo-bar');
    });
  });
});

it.todo('search/filter/table');

it.todo('export as csv');

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
                edges: [buildInvoiceWith({ node: { id: '3344', invoiceNumber: '3322' } })],
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

    const row = screen.getByRole('row', { name: /3322/ });

    const moreActionsButton = within(row).getByRole('button', { name: 'More actions' });

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
                      invoiceNumber: '3322',
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

    const row = screen.getByRole('row', { name: /3322/ });

    const moreActionsButton = within(row).getByRole('button', { name: 'More actions' });

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
                edges: [buildInvoiceWith({ node: { id: '3344', invoiceNumber: '3322' } })],
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

    const row = screen.getByRole('row', { name: /3322/ });

    const moreActionsButton = within(row).getByRole('button', { name: 'More actions' });

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
                edges: [buildInvoiceWith({ node: { id: '3344', invoiceNumber: '3322' } })],
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

    const row = screen.getByRole('row', { name: /3322/ });

    const moreActionsButton = within(row).getByRole('button', { name: 'More actions' });

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

  it('opens the payment history dialog', async () => {
    const getInvoicePaymentHistory = vi.fn();

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
                      invoiceNumber: '3322',
                      status: InvoiceStatusCode.PartiallyPaid,
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

    const row = screen.getByRole('row', { name: /3322/ });
    const moreActionsButton = within(row).getByRole('button', { name: 'More actions' });

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

  it('does not show payment history if status is Open', async () => {
    server.use(
      graphql.query('GetInvoices', () =>
        HttpResponse.json(
          buildInvoicesResponseWith({
            data: {
              invoices: {
                edges: [
                  buildInvoiceWith({
                    node: { invoiceNumber: '3322', status: InvoiceStatusCode.Open },
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

    const row = screen.getByRole('row', { name: /3322/ });
    const moreActionsButton = within(row).getByRole('button', { name: 'More actions' });

    await userEvent.click(moreActionsButton);

    expect(
      screen.queryByRole('menuitem', { name: 'View payment history' }),
    ).not.toBeInTheDocument();
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
                      invoiceNumber: '3322',
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

    const row = screen.getByRole('row', { name: /3322/ });
    const moreActionsButton = within(row).getByRole('button', { name: 'More actions' });

    await userEvent.click(moreActionsButton);

    await userEvent.click(screen.getByRole('menuitem', { name: 'Pay' }));

    await waitFor(() => {
      expect(window.location.href).toEqual('https://example.com/checkout?cartId=foo-bar');
    });
  });

  it('does not show the pay button if open balance is 0', async () => {
    server.use(
      graphql.query('GetInvoices', () =>
        HttpResponse.json(
          buildInvoicesResponseWith({
            data: {
              invoices: {
                edges: [
                  buildInvoiceWith({
                    node: {
                      invoiceNumber: '3322',
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

    const row = screen.getByRole('row', { name: /3322/ });
    const moreActionsButton = within(row).getByRole('button', { name: 'More actions' });

    await userEvent.click(moreActionsButton);

    expect(screen.queryByRole('menuitem', { name: 'Pay' })).not.toBeInTheDocument();
  });
});

it('exports the list of invoices as CSV', async () => {
  const getExportInvoicesAsCSVResponse = vi.fn();

  server.use(
    graphql.query('GetInvoices', () =>
      HttpResponse.json(buildInvoicesResponseWith('WHATEVER_VALUES')),
    ),
    graphql.query('GetInvoiceStats', () =>
      HttpResponse.json(buildInvoiceStatsResponseWith('WHATEVER_VALUES')),
    ),
    graphql.mutation('ExportInvoicesAsCSV', ({ variables }) =>
      HttpResponse.json(getExportInvoicesAsCSVResponse(variables)),
    ),
  );

  when(getExportInvoicesAsCSVResponse)
    .calledWith({
      invoiceFilterData: {
        search: '',
        idIn: '',
        orderNumber: '',
        beginDateAt: null,
        endDateAt: null,
        status: [],
        orderBy: '-invoice_number',
        companyIds: [Number(preloadedState.company.companyInfo.id)],
      },
      lang: 'en',
    })
    .thenReturn({
      data: {
        invoicesExport: {
          url: 'https://example.com/invoices.csv',
        },
      },
    });

  vi.spyOn(window, 'open').mockImplementation(vi.fn());

  renderWithProviders(<Invoice />, { preloadedState });

  await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

  const exportButton = screen.getByRole('button', { name: 'Export filtered as CSV' });

  await userEvent.click(exportButton);

  await waitFor(() => {
    expect(window.open).toHaveBeenCalledWith('https://example.com/invoices.csv', '_blank');
  });
});

it('exports selected invoices as CSV', async () => {
  const getExportInvoicesAsCSVResponse = vi.fn();

  server.use(
    graphql.query('GetInvoices', () =>
      HttpResponse.json(
        buildInvoicesResponseWith({
          data: {
            invoices: {
              edges: [
                buildInvoiceWith({
                  node: {
                    id: '1441',
                    invoiceNumber: '3322',
                    companyInfo: { companyId: preloadedState.company.companyInfo.id },
                  },
                }),
                buildInvoiceWith({
                  node: {
                    id: '1313',
                    invoiceNumber: '4343',
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
    graphql.mutation('ExportInvoicesAsCSV', ({ variables }) =>
      HttpResponse.json(getExportInvoicesAsCSVResponse(variables)),
    ),
  );

  when(getExportInvoicesAsCSVResponse)
    .calledWith({
      invoiceFilterData: {
        search: '',
        idIn: '1441,1313',
        orderNumber: '',
        beginDateAt: null,
        endDateAt: null,
        status: [],
        orderBy: '-invoice_number',
        companyIds: [Number(preloadedState.company.companyInfo.id)],
      },
      lang: 'en',
    })
    .thenReturn({
      data: {
        invoicesExport: {
          url: 'https://example.com/invoices.csv',
        },
      },
    });

  vi.spyOn(window, 'open').mockImplementation(vi.fn());

  renderWithProviders(<Invoice />, { preloadedState });

  await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

  const row1 = screen.getByRole('row', { name: /3322/ });
  const row2 = screen.getByRole('row', { name: /4343/ });

  await userEvent.click(within(row1).getByRole('checkbox'));
  await userEvent.click(within(row2).getByRole('checkbox'));

  const exportButton = screen.getByRole('button', { name: 'Export selected as CSV' });

  await userEvent.click(exportButton);

  await waitFor(() => {
    expect(window.open).toHaveBeenCalledWith('https://example.com/invoices.csv', '_blank');
  });
});

describe('when the url contains an invoiceId parameter', () => {
  it('display invoices matching the invoiceId and expands them', async () => {
    const pdfFile = new Blob(['%PDF-1.4 Mock PDF Content'], { type: 'application/pdf' });

    const getInvoicesResponse = vi.fn();
    const getInvoicePDFUrlResponse = vi.fn();

    server.use(
      graphql.query('GetInvoices', ({ query }) => HttpResponse.json(getInvoicesResponse(query))),
      graphql.query('GetInvoiceStats', () =>
        HttpResponse.json(buildInvoiceStatsResponseWith('WHATEVER_VALUES')),
      ),
      graphql.mutation('GetInvoicePDFUrl', ({ query }) =>
        HttpResponse.json(getInvoicePDFUrlResponse(query)),
      ),
      http.get('https://example.com/123456.pdf', async () =>
        HttpResponse.arrayBuffer(await pdfFile.arrayBuffer(), {
          headers: { 'Content-Type': 'application/pdf' },
        }),
      ),
      http.get('https://example.com/123478.pdf', async () =>
        HttpResponse.arrayBuffer(await pdfFile.arrayBuffer(), {
          headers: { 'Content-Type': 'application/pdf' },
        }),
      ),
    );

    when(getInvoicePDFUrlResponse)
      .calledWith(stringContainingAll('123456'))
      .thenReturn({ data: { invoicePdf: { url: 'https://example.com/123456.pdf' } } });

    when(getInvoicePDFUrlResponse)
      .calledWith(stringContainingAll('123478'))
      .thenReturn({ data: { invoicePdf: { url: 'https://example.com/123478.pdf' } } });

    when(getInvoicesResponse)
      .calledWith(stringContainingAll('search: "1234"'))
      .thenReturn(
        buildInvoicesResponseWith({
          data: {
            invoices: {
              edges: [
                buildInvoiceWith({ node: { id: '123456' } }),
                buildInvoiceWith({ node: { id: '123478' } }),
              ],
            },
          },
        }),
      );

    renderWithProviders(<Invoice />, {
      preloadedState,
      initialEntries: [{ search: '?invoiceId=1234' }],
    });

    const { log } = console;

    vi.spyOn(console, 'log').mockImplementation(log);

    // PDFObject will log a warning in the console if it cannot embed the PDF
    // eslint-disable-next-line no-console
    when(console.log)
      .calledWith(stringContainingAll('[PDFObject]'), expect.anything())
      .thenReturn();

    when(window.URL.createObjectURL)
      .calledWith(pdfFile)
      .thenDo(() => faker.internet.url());

    await waitFor(() => {
      expect(screen.getAllByRole('link', { name: 'Download PDF' })).toHaveLength(2);
    });
  });
});

describe('when the url contains a receiptId (coming back from checkout)', () => {
  it('displays the receipt information', async () => {
    const getReceiptResponse = vi.fn();

    server.use(
      graphql.query('GetInvoices', () =>
        HttpResponse.json(buildInvoicesResponseWith('WHATEVER_VALUES')),
      ),
      graphql.query('GetInvoiceStats', () =>
        HttpResponse.json(buildInvoiceStatsResponseWith('WHATEVER_VALUES')),
      ),
      graphql.query('GetInvoiceReceipt', ({ query }) =>
        HttpResponse.json(getReceiptResponse(query)),
      ),
    );

    when(getReceiptResponse)
      .calledWith(stringContainingAll('id: 1234'))
      .thenReturn({
        data: {
          receipt: {
            paymentId: 13802,
            createdAt: getUnixTime(new Date('July 3 2025')),
            transactionType: 'Paid',
            paymentType: 'visa ending in 1111',
            totalAmount: '30.0000',
            referenceNumber: '123123',
            details: { paymentDetails: { comment: 'Foo bar payment comment' } },
            receiptLineSet: {
              edges: [
                buildReceiptLineNodeWith({
                  node: { invoiceNumber: '00053858', amount: { code: 'USD', value: '20.0000' } },
                }),
                buildReceiptLineNodeWith({
                  node: { invoiceNumber: '00053857', amount: { code: 'USD', value: '10.0000' } },
                }),
              ],
            },
          },
        },
      });

    renderWithProviders(<Invoice />, {
      preloadedState,
      initialEntries: [{ search: '?receiptId=1234' }],
    });

    const modal = await screen.findByRole('dialog', { name: 'Thank you for your payment' });

    expect(within(modal).getByText('Payment#:')).toBeInTheDocument();
    expect(within(modal).getByText('13802')).toBeInTheDocument();

    expect(within(modal).getByText('Payment received on:')).toBeInTheDocument();
    expect(within(modal).getByText('3 July 2025')).toBeInTheDocument();

    expect(within(modal).getByText('Transaction type:')).toBeInTheDocument();
    expect(within(modal).getByText('Paid')).toBeInTheDocument();

    expect(within(modal).getByText('Payment type:')).toBeInTheDocument();
    expect(within(modal).getByText('Visa ending in 1111')).toBeInTheDocument();

    expect(within(modal).getByText('Payment total:')).toBeInTheDocument();
    expect(within(modal).getByText('$30.00')).toBeInTheDocument();

    expect(within(modal).getByText('Reference:')).toBeInTheDocument();
    expect(within(modal).getByText('123123')).toBeInTheDocument();

    expect(within(modal).getByText('Payment comment:')).toBeInTheDocument();
    expect(within(modal).getByText('Foo bar payment comment')).toBeInTheDocument();

    expect(within(modal).getByText('Invoices paid')).toBeInTheDocument();
    expect(
      within(modal).getByText('You made payments towards the invoices shown below'),
    ).toBeInTheDocument();

    expect(within(modal).getByText('Invoice#')).toBeInTheDocument();
    expect(within(modal).getByText('Amount paid')).toBeInTheDocument();

    expect(within(modal).getByText('Invoices paid')).toBeInTheDocument();
    expect(
      within(modal).getByText('You made payments towards the invoices shown below'),
    ).toBeInTheDocument();

    expect(within(modal).getByText('00053858')).toBeInTheDocument();
    expect(within(modal).getByText('$20.00')).toBeInTheDocument();

    expect(within(modal).getByText('00053857')).toBeInTheDocument();
    expect(within(modal).getByText('$10.00')).toBeInTheDocument();

    await userEvent.click(within(modal).getByRole('button', { name: 'Ok' }));

    await waitFor(() => {
      expect(
        screen.queryByRole('dialog', { name: 'Thank you for your payment' }),
      ).not.toBeInTheDocument();
    });
  });
});
