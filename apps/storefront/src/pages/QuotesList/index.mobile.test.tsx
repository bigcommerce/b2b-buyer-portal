import {
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
  userEvent,
} from 'tests/test-utils';

import { QuoteEdge, QuotesListB2B, QuotesListBC } from '@/shared/service/b2b/graphql/quote';
import { ShoppingListsCreatedByUser } from '@/shared/service/b2b/graphql/shoppingList';
import { CompanyStatus, UserTypes } from '@/types';

import QuotesList from './index';

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

const buildQuotesListBCWith = builder<QuotesListBC>(() => {
  const totalCount = faker.number.int({ min: 0, max: 10 });
  const edges = bulk(buildQuoteEdgeWith, 'WHATEVER_VALUES').times(totalCount);

  return { data: { customerQuotes: { totalCount, edges } } };
});

const { server } = startMockServer();

beforeEach(() => {
  vi.spyOn(document.body, 'clientWidth', 'get').mockReturnValue(500);
});

const storeInfoWithDateFormat = buildStoreInfoStateWith({ timeFormat: { display: 'j F Y' } });

describe('when the user is a B2B customer', () => {
  const approvedB2BCompany = buildCompanyStateWith({
    companyInfo: { status: CompanyStatus.APPROVED },
    customer: { userType: UserTypes.MULTIPLE_B2C },
  });

  const preloadedState = { company: approvedB2BCompany, storeInfo: storeInfoWithDateFormat };

  it('displays cards listing each key attribute of a quote', async () => {
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

    expect(await screen.findByText('Title:')).toBeInTheDocument();
    expect(screen.getByText('Sales rep:')).toBeInTheDocument();
    expect(screen.getByText('Created by:')).toBeInTheDocument();
    expect(screen.getByText('Date created:')).toBeInTheDocument();
    expect(screen.getByText('Last update:')).toBeInTheDocument();
    expect(screen.getByText('Expiration date:')).toBeInTheDocument();
    expect(screen.getByText('Subtotal:')).toBeInTheDocument();
  });

  it('displays a card with values for each key attribute of a quote', async () => {
    const manySocks = buildQuoteEdgeWith({
      node: {
        quoteNumber: '123456789',
        quoteTitle: 'Many Socks',
        salesRepEmail: 'fred.salesman@acme.com',
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

    expect(await screen.findByRole('heading', { name: '123456789' })).toBeInTheDocument();
    expect(screen.getByText('Open')).toBeInTheDocument();
    expect(screen.getByText('Many Socks')).toBeInTheDocument();
    expect(screen.getByText('fred.salesman@acme.com')).toBeInTheDocument();
    expect(screen.getByText('Sam Shopper')).toBeInTheDocument();
    expect(screen.getByText('1 January 2025')).toBeInTheDocument();
    expect(screen.getByText('2 February 2025')).toBeInTheDocument();
    expect(screen.getByText('3 March 2025')).toBeInTheDocument();
    expect(screen.getByText('$101.99')).toBeInTheDocument();
  });

  it('displays a quote per card', async () => {
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

    // loose test as there is no way to target the cards individually
    expect(await screen.findByText('Many Socks')).toBeInTheDocument();
    expect(screen.getByText('Some Trouser')).toBeInTheDocument();
    expect(screen.getByText('One Shirt')).toBeInTheDocument();
  });

  describe('when clicking on "view" within a non-draft quote', () => {
    it('navigates to the respective quote details page, with the created date', async () => {
      const manySocks = buildQuoteEdgeWith({
        node: {
          quoteTitle: 'Many Socks',
          id: '939232',
          createdAt: getUnixTime(new Date('1 January 2025')),
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

      const { navigation } = renderWithProviders(<QuotesList />, { preloadedState });

      await userEvent.click(await screen.findByText('VIEW'));

      expect(navigation).toHaveBeenCalledWith(
        `/quoteDetail/939232?date=${getUnixTime(new Date('1 January 2025'))}`,
      );
    });
  });

  describe('when clicking on "view" within the draft quote', () => {
    // A user can only ever have one draft quote at a time
    it('navigates to the quote draft page', async () => {
      const workInProgress = buildQuoteEdgeWith({
        node: { quoteTitle: 'Work in Progress', status: 0 },
      });

      const quotesListB2B = buildQuotesListB2BWith({
        data: { quotes: { totalCount: 3, edges: [workInProgress] } },
      });

      server.use(
        graphql.query('GetQuotesList', () => HttpResponse.json(quotesListB2B)),
        graphql.query('GetShoppingListsCreatedByUser', () =>
          HttpResponse.json(buildShoppingListsCreatedByUserWith('WHATEVER_VALUES')),
        ),
      );

      const { navigation } = renderWithProviders(<QuotesList />, { preloadedState });

      await userEvent.click(await screen.findByText('VIEW'));

      expect(navigation).toHaveBeenCalledWith('/quoteDraft');
    });
  });

  it.each([
    { status: 0, expectedLabel: 'Draft' },
    { status: 1, expectedLabel: 'Open' },
    { status: 4, expectedLabel: 'Ordered' },
    { status: 5, expectedLabel: 'Expired' },
  ])("displays a quote's status as $expectedLabel", async ({ status, expectedLabel }) => {
    const someQuote = buildQuoteEdgeWith({ node: { status } });

    const quotesListB2B = buildQuotesListB2BWith({
      data: { quotes: { totalCount: 4, edges: [someQuote] } },
    });

    server.use(
      graphql.query('GetQuotesList', () => HttpResponse.json(quotesListB2B)),
      graphql.query('GetShoppingListsCreatedByUser', () =>
        HttpResponse.json(buildShoppingListsCreatedByUserWith('WHATEVER_VALUES')),
      ),
    );

    renderWithProviders(<QuotesList />, { preloadedState });

    expect(await screen.findByText(expectedLabel)).toBeInTheDocument();
  });

  describe('when the user has no quotes', () => {
    it('displays a message of "No data"', async () => {
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
    });
  });
});

describe('when the user is a B2C customer', () => {
  const nonCompany = buildCompanyStateWith({ customer: { b2bId: undefined } });

  const preloadedState = { company: nonCompany, storeInfo: storeInfoWithDateFormat };

  it('displays cards listing each key attribute of a quote', async () => {
    const quotesListB2B = buildQuotesListBCWith({
      data: { customerQuotes: { totalCount: 1, edges: [buildQuoteEdgeWith('WHATEVER_VALUES')] } },
    });

    server.use(graphql.query('GetQuotesList', () => HttpResponse.json(quotesListB2B)));

    renderWithProviders(<QuotesList />, { preloadedState });

    expect(await screen.findByText('Title:')).toBeInTheDocument();
    expect(screen.getByText('Sales rep:')).toBeInTheDocument();
    expect(screen.getByText('Created by:')).toBeInTheDocument();
    expect(screen.getByText('Date created:')).toBeInTheDocument();
    expect(screen.getByText('Last update:')).toBeInTheDocument();
    expect(screen.getByText('Expiration date:')).toBeInTheDocument();
    expect(screen.getByText('Subtotal:')).toBeInTheDocument();
  });

  it('displays a card with values for each key attribute of a quote', async () => {
    const manySocks = buildQuoteEdgeWith({
      node: {
        quoteNumber: '123456789',
        quoteTitle: 'Many Socks',
        salesRepEmail: 'fred.salesman@acme.com',
        createdBy: 'Sam Shopper',
        createdAt: getUnixTime(new Date('1 January 2025')),
        updatedAt: getUnixTime(new Date('2 February 2025')),
        expiredAt: getUnixTime(new Date('3 March 2025')),
        totalAmount: '101.99',
        currency: { token: '$', location: 'left', decimalToken: '.', decimalPlaces: 2 },
        status: 1,
      },
    });

    const quotesListB2B = buildQuotesListBCWith({
      data: { customerQuotes: { totalCount: 1, edges: [manySocks] } },
    });

    server.use(graphql.query('GetQuotesList', () => HttpResponse.json(quotesListB2B)));

    renderWithProviders(<QuotesList />, { preloadedState });

    expect(await screen.findByRole('heading', { name: '123456789' })).toBeInTheDocument();
    expect(screen.getByText('Open')).toBeInTheDocument();
    expect(screen.getByText('Many Socks')).toBeInTheDocument();
    expect(screen.getByText('fred.salesman@acme.com')).toBeInTheDocument();
    expect(screen.getByText('Sam Shopper')).toBeInTheDocument();
    expect(screen.getByText('1 January 2025')).toBeInTheDocument();
    expect(screen.getByText('2 February 2025')).toBeInTheDocument();
    expect(screen.getByText('3 March 2025')).toBeInTheDocument();
    expect(screen.getByText('$101.99')).toBeInTheDocument();
  });

  it('displays a quote per card', async () => {
    const manySocks = buildQuoteEdgeWith({ node: { quoteTitle: 'Many Socks' } });
    const someTrousers = buildQuoteEdgeWith({ node: { quoteTitle: 'Some Trouser' } });
    const oneShirt = buildQuoteEdgeWith({ node: { quoteTitle: 'One Shirt' } });

    const quotesListB2B = buildQuotesListBCWith({
      data: { customerQuotes: { totalCount: 3, edges: [manySocks, someTrousers, oneShirt] } },
    });

    server.use(graphql.query('GetQuotesList', () => HttpResponse.json(quotesListB2B)));

    renderWithProviders(<QuotesList />, { preloadedState });

    // loose test as there is no way to target the cards individually
    expect(await screen.findByText('Many Socks')).toBeInTheDocument();
    expect(screen.getByText('Some Trouser')).toBeInTheDocument();
    expect(screen.getByText('One Shirt')).toBeInTheDocument();
  });

  describe('when clicking on "view" within a non-draft quote', () => {
    it('navigates to the respective quote details page, with the created date', async () => {
      const manySocks = buildQuoteEdgeWith({
        node: {
          quoteTitle: 'Many Socks',
          id: '939232',
          createdAt: getUnixTime(new Date('1 January 2025')),
          status: 1,
        },
      });

      const quotesListB2B = buildQuotesListBCWith({
        data: { customerQuotes: { totalCount: 1, edges: [manySocks] } },
      });

      server.use(graphql.query('GetQuotesList', () => HttpResponse.json(quotesListB2B)));

      const { navigation } = renderWithProviders(<QuotesList />, { preloadedState });

      await userEvent.click(await screen.findByText('VIEW'));

      expect(navigation).toHaveBeenCalledWith(
        `/quoteDetail/939232?date=${getUnixTime(new Date('1 January 2025'))}`,
      );
    });
  });

  describe('when clicking on "view" within the draft quote', () => {
    // A user can only ever have one draft quote at a time
    it('navigates to the quote draft page', async () => {
      const workInProgress = buildQuoteEdgeWith({
        node: { quoteTitle: 'Work in Progress', status: 0 },
      });

      const quotesListB2B = buildQuotesListBCWith({
        data: { customerQuotes: { totalCount: 3, edges: [workInProgress] } },
      });

      server.use(graphql.query('GetQuotesList', () => HttpResponse.json(quotesListB2B)));

      const { navigation } = renderWithProviders(<QuotesList />, { preloadedState });

      await userEvent.click(await screen.findByText('VIEW'));

      expect(navigation).toHaveBeenCalledWith('/quoteDraft');
    });
  });

  it.each([
    { status: 0, expectedLabel: 'Draft' },
    { status: 1, expectedLabel: 'Open' },
    { status: 4, expectedLabel: 'Ordered' },
    { status: 5, expectedLabel: 'Expired' },
  ])("displays a quote's status as $expectedLabel", async ({ status, expectedLabel }) => {
    const someQuote = buildQuoteEdgeWith({ node: { status } });

    const quotesListB2B = buildQuotesListBCWith({
      data: { customerQuotes: { totalCount: 4, edges: [someQuote] } },
    });

    server.use(graphql.query('GetQuotesList', () => HttpResponse.json(quotesListB2B)));

    renderWithProviders(<QuotesList />, { preloadedState });

    expect(await screen.findByText(expectedLabel)).toBeInTheDocument();
  });

  describe('when the user has no quotes', () => {
    it('displays a message of "No data"', async () => {
      const quotesListB2B = buildQuotesListBCWith({
        data: { customerQuotes: { totalCount: 0, edges: [] } },
      });

      server.use(graphql.query('GetQuotesList', () => HttpResponse.json(quotesListB2B)));

      renderWithProviders(<QuotesList />, { preloadedState });

      expect(await screen.findByText('No data')).toBeInTheDocument();
    });
  });
});
