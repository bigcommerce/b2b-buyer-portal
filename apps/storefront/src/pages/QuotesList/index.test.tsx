import { graphql, HttpResponse } from 'msw';
import {
  buildCompanyStateWith,
  builder,
  buildStoreInfoStateWith,
  bulk,
  faker,
  getUnixTime,
  renderWithProviders,
  screen,
  startMockServer,
  userEvent,
  within,
} from 'tests/test-utils';

import { QuoteEdge, QuotesListB2B } from '@/shared/service/b2b/graphql/quote';
import { ShoppingListsCreatedByUser } from '@/shared/service/b2b/graphql/shoppingList';
import { CompanyStatus, UserTypes } from '@/types';

import QuotesList from './index';

// Required to stop the view using the mobile layout
// which often switches to different, non-semantic elements
vitest.mock('@/hooks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/hooks')>()),
  useMobile: () => [false],
}));

const buildShoppingListsCreatedByUserWith = builder<ShoppingListsCreatedByUser>(() => ({
  data: { createdByUser: { results: { createdBy: [], salesRep: [] } } },
}));

const buildQuoteEdgeWith = builder<QuoteEdge>(() => ({
  node: {
    id: faker.string.uuid(),
    createdAt: getUnixTime(faker.date.past()),
    updatedAt: getUnixTime(faker.date.recent()),
    quoteNumber: faker.string.numeric(),
    quoteTitle: faker.commerce.productName(),
    referenceNumber: faker.string.numeric(),
    createdBy: faker.person.fullName(),
    expiredAt: getUnixTime(faker.date.future()),
    discount: faker.commerce.price(),
    grandTotal: faker.commerce.price(),
    currency: {
      token: faker.finance.currencySymbol(),
      location: faker.location.country(),
      currencyCode: faker.finance.currencyCode(),
      decimalToken: faker.string.symbol(),
      decimalPlaces: faker.number.int({ min: 0, max: 100 }),
      thousandsToken: faker.string.symbol(),
      currencyExchangeRate: faker.finance.amount(),
    },
    status: faker.helpers.arrayElement([0, 1, 4, 5]),
    salesRep: faker.person.fullName(),
    salesRepEmail: faker.internet.email(),
    orderId: faker.string.uuid(),
    subtotal: faker.commerce.price(),
    totalAmount: faker.commerce.price(),
    taxTotal: faker.commerce.price(),
  },
}));

const buildQuotesListB2BWith = builder<QuotesListB2B>(() => {
  const totalCount = faker.number.int({ min: 0, max: 10 });
  const edges = bulk(buildQuoteEdgeWith, 'WHATEVER_VALUES').times(totalCount);

  return { data: { quotes: { totalCount, edges } } };
});

const { server } = startMockServer();

describe('when the user is a B2B customer', () => {
  const approvedB2BCompany = buildCompanyStateWith({
    companyInfo: { status: CompanyStatus.APPROVED },
    customer: { userType: UserTypes.MULTIPLE_B2C },
  });

  const storeInfoWithDateFormat = buildStoreInfoStateWith({ timeFormat: { display: 'j F Y' } });

  const preloadedState = { company: approvedB2BCompany, storeInfo: storeInfoWithDateFormat };

  it('displays a table with headings for each key attribute of a quote', async () => {
    const quotesListB2B = buildQuotesListB2BWith({
      data: { quotes: { totalCount: 1, edges: [buildQuoteEdgeWith('WHATEVER_VALUES')] } },
    });

    server.use(
      graphql.query('GetQuotesList', () => HttpResponse.json(quotesListB2B)),
      graphql.query('GetShoppingListsCreatedByUser', () =>
        HttpResponse.json(buildShoppingListsCreatedByUserWith('WHATEVER_VALUES')),
      ),
    );

    renderWithProviders(<QuotesList />, { preloadedState });

    const table = await screen.findByRole('table');

    expect(within(table).getByRole('columnheader', { name: 'Quote #' })).toBeInTheDocument();
    expect(within(table).getByRole('columnheader', { name: 'Title' })).toBeInTheDocument();
    expect(within(table).getByRole('columnheader', { name: 'Sales rep' })).toBeInTheDocument();
    expect(within(table).getByRole('columnheader', { name: 'Created by' })).toBeInTheDocument();
    expect(within(table).getByRole('columnheader', { name: 'Date created' })).toBeInTheDocument();
    expect(within(table).getByRole('columnheader', { name: 'Last update' })).toBeInTheDocument();
    expect(
      within(table).getByRole('columnheader', { name: 'Expiration date' }),
    ).toBeInTheDocument();
    expect(within(table).getByRole('columnheader', { name: 'Subtotal' })).toBeInTheDocument();
    expect(within(table).getByRole('columnheader', { name: 'Status' })).toBeInTheDocument();
  });

  it('displays a table with values for each key attribute of a quote', async () => {
    const manySocks = buildQuoteEdgeWith({
      node: {
        quoteNumber: '123456789',
        quoteTitle: 'Many Socks',
        salesRep: 'Fred Salesman',
        createdBy: 'Sam Shopper',
        createdAt: getUnixTime(new Date('1 January 2025')),
        updatedAt: getUnixTime(new Date('2 February 2025')),
        expiredAt: getUnixTime(new Date('3 March 2025')),
        totalAmount: '101.99',
        currency: { token: '$', location: 'left', decimalToken: '.', decimalPlaces: 2 },
        status: 1,
      },
    });

    const quotesListB2B = buildQuotesListB2BWith({
      data: { quotes: { totalCount: 1, edges: [manySocks] } },
    });

    server.use(
      graphql.query('GetQuotesList', () => HttpResponse.json(quotesListB2B)),
      graphql.query('GetShoppingListsCreatedByUser', () =>
        HttpResponse.json(buildShoppingListsCreatedByUserWith('WHATEVER_VALUES')),
      ),
    );

    renderWithProviders(<QuotesList />, { preloadedState });

    const table = await screen.findByRole('table');
    const row = within(table).getByRole('row', { name: /Many Socks/ });

    expect(within(row).getByRole('cell', { name: '123456789' })).toBeInTheDocument();
    expect(within(row).getByRole('cell', { name: 'Many Socks' })).toBeInTheDocument();
    expect(within(row).getByRole('cell', { name: 'Fred Salesman' })).toBeInTheDocument();
    expect(within(row).getByRole('cell', { name: 'Sam Shopper' })).toBeInTheDocument();
    expect(within(row).getByRole('cell', { name: '1 January 2025' })).toBeInTheDocument();
    expect(within(row).getByRole('cell', { name: '2 February 2025' })).toBeInTheDocument();
    expect(within(row).getByRole('cell', { name: '3 March 2025' })).toBeInTheDocument();
    expect(within(row).getByRole('cell', { name: '$101.99' })).toBeInTheDocument();
    expect(within(row).getByRole('cell', { name: 'Open' })).toBeInTheDocument();
  });

  it('displays a quote per row', async () => {
    const manySocks = buildQuoteEdgeWith({ node: { quoteTitle: 'Many Socks' } });
    const someTrousers = buildQuoteEdgeWith({ node: { quoteTitle: 'Some Trouser' } });
    const oneShirt = buildQuoteEdgeWith({ node: { quoteTitle: 'One Shirt' } });

    const quotesListB2B = buildQuotesListB2BWith({
      data: { quotes: { totalCount: 3, edges: [manySocks, someTrousers, oneShirt] } },
    });

    server.use(
      graphql.query('GetQuotesList', () => HttpResponse.json(quotesListB2B)),
      graphql.query('GetShoppingListsCreatedByUser', () =>
        HttpResponse.json(buildShoppingListsCreatedByUserWith('WHATEVER_VALUES')),
      ),
    );

    renderWithProviders(<QuotesList />, { preloadedState });

    const table = await screen.findByRole('table');

    expect(within(table).getByRole('row', { name: /Many Socks/ })).toBeInTheDocument();
    expect(within(table).getByRole('row', { name: /Some Trouser/ })).toBeInTheDocument();
    expect(within(table).getByRole('row', { name: /One Shirt/ })).toBeInTheDocument();
  });

  describe('when clicking on the row of a non-draft quote', () => {
    it('navigates to the respective quote details page, with the created date', async () => {
      const manySocks = buildQuoteEdgeWith({
        node: {
          quoteTitle: 'Many Socks',
          id: '939232',
          createdAt: getUnixTime(new Date('1 January 2025')),
          status: 1,
        },
      });
      const someQuote = buildQuoteEdgeWith('WHATEVER_VALUES');
      const anotherQuote = buildQuoteEdgeWith('WHATEVER_VALUES');

      const quotesListB2B = buildQuotesListB2BWith({
        data: { quotes: { totalCount: 3, edges: [someQuote, manySocks, anotherQuote] } },
      });

      server.use(
        graphql.query('GetQuotesList', () => HttpResponse.json(quotesListB2B)),
        graphql.query('GetShoppingListsCreatedByUser', () =>
          HttpResponse.json(buildShoppingListsCreatedByUserWith('WHATEVER_VALUES')),
        ),
      );

      const { navigation } = renderWithProviders(<QuotesList />, { preloadedState });

      const table = await screen.findByRole('table');

      await userEvent.click(within(table).getByRole('row', { name: /Many Socks/ }));

      expect(navigation).toHaveBeenCalledWith(
        `/quoteDetail/939232?date=${getUnixTime(new Date('1 January 2025'))}`,
      );
    });
  });

  describe('when clicking on the row of the draft quote', () => {
    // A user can only ever have one draft quote at a time
    it('navigates to the quote draft page', async () => {
      const workInProgress = buildQuoteEdgeWith({
        node: { quoteTitle: 'Work in Progress', status: 0 },
      });
      const someQuote = buildQuoteEdgeWith('WHATEVER_VALUES');
      const anotherQuote = buildQuoteEdgeWith('WHATEVER_VALUES');

      const quotesListB2B = buildQuotesListB2BWith({
        data: { quotes: { totalCount: 3, edges: [someQuote, workInProgress, anotherQuote] } },
      });

      server.use(
        graphql.query('GetQuotesList', () => HttpResponse.json(quotesListB2B)),
        graphql.query('GetShoppingListsCreatedByUser', () =>
          HttpResponse.json(buildShoppingListsCreatedByUserWith('WHATEVER_VALUES')),
        ),
      );

      const { navigation } = renderWithProviders(<QuotesList />, { preloadedState });

      const table = await screen.findByRole('table');

      await userEvent.click(within(table).getByRole('row', { name: /Work in Progress/ }));

      expect(navigation).toHaveBeenCalledWith('/quoteDraft');
    });
  });

  it('displays the current status of each quote', async () => {
    const manySocks = buildQuoteEdgeWith({ node: { quoteTitle: 'Many Socks', status: 0 } });
    const someTrousers = buildQuoteEdgeWith({ node: { quoteTitle: 'Some Trouser', status: 1 } });
    const oneShirt = buildQuoteEdgeWith({ node: { quoteTitle: 'One Shirt', status: 4 } });
    const everyHat = buildQuoteEdgeWith({ node: { quoteTitle: 'Every Hat', status: 5 } });

    const quotesListB2B = buildQuotesListB2BWith({
      data: { quotes: { totalCount: 4, edges: [manySocks, someTrousers, oneShirt, everyHat] } },
    });

    server.use(
      graphql.query('GetQuotesList', () => HttpResponse.json(quotesListB2B)),
      graphql.query('GetShoppingListsCreatedByUser', () =>
        HttpResponse.json(buildShoppingListsCreatedByUserWith('WHATEVER_VALUES')),
      ),
    );

    renderWithProviders(<QuotesList />, { preloadedState });

    const table = await screen.findByRole('table');

    const rowOfManySocks = within(table).getByRole('row', { name: /Many Socks/ });
    expect(within(rowOfManySocks).getByText('Draft')).toBeInTheDocument();

    const rowOfSomeTrouser = within(table).getByRole('row', { name: /Some Trouser/ });
    expect(within(rowOfSomeTrouser).getByText('Open')).toBeInTheDocument();

    const rowOfOneShirt = within(table).getByRole('row', { name: /One Shirt/ });
    expect(within(rowOfOneShirt).getByText('Ordered')).toBeInTheDocument();

    const rowOfEveryHat = within(table).getByRole('row', { name: /Every Hat/ });
    expect(within(rowOfEveryHat).getByText('Expired')).toBeInTheDocument();
  });

  describe('when the user has no quotes', () => {
    it('displays a message of "No data" and does not display the quotes table', async () => {
      const quotesListB2B = buildQuotesListB2BWith({
        data: { quotes: { totalCount: 0, edges: [] } },
      });

      server.use(
        graphql.query('GetQuotesList', () => HttpResponse.json(quotesListB2B)),
        graphql.query('GetShoppingListsCreatedByUser', () =>
          HttpResponse.json(buildShoppingListsCreatedByUserWith('WHATEVER_VALUES')),
        ),
      );

      renderWithProviders(<QuotesList />, { preloadedState });

      expect(await screen.findByText('No data')).toBeInTheDocument();
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });
  });
});
