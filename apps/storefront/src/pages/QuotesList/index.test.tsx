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
  waitFor,
  within,
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

const storeInfoWithDateFormat = buildStoreInfoStateWith({ timeFormat: { display: 'j F Y' } });

describe('when the user is a B2B customer', () => {
  const approvedB2BCompany = buildCompanyStateWith({
    companyInfo: { status: CompanyStatus.APPROVED },
    customer: { userType: UserTypes.MULTIPLE_B2C },
  });

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

  describe('when the user enters a search term', () => {
    it('displays the quotes that match the search term', async () => {
      const manySocks = buildQuoteEdgeWith({ node: { quoteTitle: 'Many Socks' } });
      const someTrousers = buildQuoteEdgeWith({ node: { quoteTitle: 'Some Trouser' } });

      const allQuotes = buildQuotesListB2BWith({
        data: { quotes: { totalCount: 2, edges: [manySocks, someTrousers] } },
      });

      const getQuotesList = vitest.fn<unknown[], QuotesListB2B>().mockReturnValue(allQuotes);

      const getQuotesListQuerySpy = vitest.fn();

      server.use(
        graphql.query('GetQuotesList', ({ query }) => {
          getQuotesListQuerySpy(query);

          return HttpResponse.json(getQuotesList());
        }),
        graphql.query('GetShoppingListsCreatedByUser', () =>
          HttpResponse.json(buildShoppingListsCreatedByUserWith('WHATEVER_VALUES')),
        ),
      );

      renderWithProviders(<QuotesList />, { preloadedState });

      const searchField = await screen.findByPlaceholderText('Search');
      const table = await screen.findByRole('table');

      expect(within(table).getByRole('row', { name: /Many Socks/ })).toBeInTheDocument();
      expect(within(table).getByRole('row', { name: /Some Trouser/ })).toBeInTheDocument();

      getQuotesList.mockReturnValue(
        buildQuotesListB2BWith({
          data: { quotes: { totalCount: 1, edges: [manySocks] } },
        }),
      );

      await userEvent.type(searchField, 'Many Socks');

      await waitFor(() =>
        expect(within(table).queryByRole('row', { name: /Some Trouser/ })).not.toBeInTheDocument(),
      );

      expect(within(table).getByRole('row', { name: /Many Socks/ })).toBeInTheDocument();

      expect(getQuotesListQuerySpy).toHaveBeenLastCalledWith(
        expect.stringContaining('search: "Many Socks"'),
      );
    });
  });

  describe('when the user clears an existing search term', () => {
    it('displays all quotes', async () => {
      const manySocks = buildQuoteEdgeWith({ node: { quoteTitle: 'Many Socks' } });
      const someTrousers = buildQuoteEdgeWith({ node: { quoteTitle: 'Some Trouser' } });

      const allQuotes = buildQuotesListB2BWith({
        data: { quotes: { totalCount: 2, edges: [manySocks, someTrousers] } },
      });

      const getQuotesList = vitest.fn<unknown[], QuotesListB2B>().mockReturnValue(allQuotes);

      const getQuotesListQuerySpy = vitest.fn();

      server.use(
        graphql.query('GetQuotesList', ({ query }) => {
          getQuotesListQuerySpy(query);

          return HttpResponse.json(getQuotesList());
        }),
        graphql.query('GetShoppingListsCreatedByUser', () =>
          HttpResponse.json(buildShoppingListsCreatedByUserWith('WHATEVER_VALUES')),
        ),
      );

      renderWithProviders(<QuotesList />, { preloadedState });

      const searchField = await screen.findByPlaceholderText('Search');
      const table = await screen.findByRole('table');

      getQuotesList.mockReturnValue(
        buildQuotesListB2BWith({
          data: { quotes: { totalCount: 1, edges: [manySocks] } },
        }),
      );

      await userEvent.type(searchField, 'Many Socks');

      await waitFor(() =>
        expect(within(table).queryByRole('row', { name: /Some Trouser/ })).not.toBeInTheDocument(),
      );

      getQuotesList.mockReturnValue(buildQuotesListB2BWith(allQuotes));

      await userEvent.click(screen.getByTestId('ClearIcon'));

      await waitFor(() =>
        expect(within(table).getByRole('row', { name: /Some Trouser/ })).toBeInTheDocument(),
      );

      expect(within(table).getByRole('row', { name: /Many Socks/ })).toBeInTheDocument();

      expect(getQuotesListQuerySpy).toHaveBeenLastCalledWith(expect.stringContaining('search: ""'));
    });
  });

  describe('when the user filters the quotes by status', () => {
    it('displays the quotes that match the selected status', async () => {
      const manySocks = buildQuoteEdgeWith({ node: { quoteTitle: 'Many Socks', status: 0 } });
      const someTrousers = buildQuoteEdgeWith({ node: { quoteTitle: 'Some Trouser', status: 1 } });

      const allQuotes = buildQuotesListB2BWith({
        data: { quotes: { totalCount: 2, edges: [manySocks, someTrousers] } },
      });

      const getQuotesList = vitest.fn<unknown[], QuotesListB2B>().mockReturnValue(allQuotes);
      const getQuotesListQuerySpy = vitest.fn();

      server.use(
        graphql.query('GetQuotesList', ({ query }) => {
          getQuotesListQuerySpy(query);

          return HttpResponse.json(getQuotesList());
        }),
        graphql.query('GetShoppingListsCreatedByUser', () =>
          HttpResponse.json(buildShoppingListsCreatedByUserWith('WHATEVER_VALUES')),
        ),
      );

      renderWithProviders(<QuotesList />, { preloadedState });

      const table = await screen.findByRole('table');

      expect(within(table).getByRole('row', { name: /Many Socks/ })).toBeInTheDocument();
      expect(within(table).getByRole('row', { name: /Some Trouser/ })).toBeInTheDocument();

      // the filter button is called "edit" for some unknown reason
      await userEvent.click(screen.getByRole('button', { name: 'edit' }));

      const filterModal = await screen.findByRole('dialog', { name: 'Filters' });

      // selects (comboboxes) are not currently selectable by label
      const quoteStatusSelect = within(filterModal).getAllByRole('combobox')[0];

      await userEvent.click(quoteStatusSelect);

      await userEvent.click(screen.getByRole('option', { name: 'Open' }));

      getQuotesList.mockReturnValue(
        buildQuotesListB2BWith({
          data: { quotes: { totalCount: 1, edges: [someTrousers] } },
        }),
      );

      await userEvent.click(within(filterModal).getByRole('button', { name: 'Apply' }));

      await waitFor(() =>
        expect(within(table).queryByRole('row', { name: /Many Socks/ })).not.toBeInTheDocument(),
      );

      expect(within(table).getByRole('row', { name: /Some Trouser/ })).toBeInTheDocument();

      expect(getQuotesListQuerySpy).toHaveBeenLastCalledWith(
        expect.stringContaining('status: "1"'),
      );
    });
  });

  describe('when filters are applied and the user clicks "Clear Filters" button', () => {
    it('displays all quotes and does not display the "Clear Filters" button', async () => {
      const manySocks = buildQuoteEdgeWith({ node: { quoteTitle: 'Many Socks', status: 0 } });
      const someTrousers = buildQuoteEdgeWith({ node: { quoteTitle: 'Some Trouser', status: 1 } });

      const allQuotes = buildQuotesListB2BWith({
        data: { quotes: { totalCount: 2, edges: [manySocks, someTrousers] } },
      });

      const getQuotesList = vitest.fn<unknown[], QuotesListB2B>().mockReturnValue(allQuotes);
      const getQuotesListQuerySpy = vitest.fn();

      server.use(
        graphql.query('GetQuotesList', ({ query }) => {
          getQuotesListQuerySpy(query);

          return HttpResponse.json(getQuotesList());
        }),
        graphql.query('GetShoppingListsCreatedByUser', () =>
          HttpResponse.json(buildShoppingListsCreatedByUserWith('WHATEVER_VALUES')),
        ),
      );

      renderWithProviders(<QuotesList />, { preloadedState });

      // the filter button is called "edit" for some unknown reason
      await userEvent.click(await screen.findByRole('button', { name: 'edit' }));

      const filterModal = await screen.findByRole('dialog', { name: 'Filters' });

      // selects (comboboxes) are not currently selectable by label
      const quoteStatusSelect = within(filterModal).getAllByRole('combobox')[0];

      await userEvent.click(quoteStatusSelect);

      await userEvent.click(screen.getByRole('option', { name: 'Open' }));

      getQuotesList.mockReturnValue(
        buildQuotesListB2BWith({
          data: { quotes: { totalCount: 1, edges: [someTrousers] } },
        }),
      );

      await userEvent.click(within(filterModal).getByRole('button', { name: 'Apply' }));

      const table = await screen.findByRole('table');

      await waitFor(() =>
        expect(within(table).queryByRole('row', { name: /Many Socks/ })).not.toBeInTheDocument(),
      );

      // the filter button is called "clear-edit" for some unknown reason
      const clearFiltersButton = screen.getByRole('button', { name: 'clear-edit' });

      getQuotesList.mockReturnValue(buildQuotesListB2BWith(allQuotes));

      await userEvent.click(clearFiltersButton);

      await waitFor(() => expect(clearFiltersButton).not.toBeInTheDocument());
      expect(within(table).getByRole('row', { name: /Many Socks/ })).toBeInTheDocument();
      expect(within(table).getByRole('row', { name: /Some Trouser/ })).toBeInTheDocument();

      expect(getQuotesListQuerySpy).toHaveBeenLastCalledWith(
        expect.not.stringContaining('status: "1"'),
      );
    });
  });

  describe('when the user click to filter by "Created by"', () => {
    it('displays a list of user options to filter by', async () => {
      const samShopper = { name: 'Sam Shopper', email: 'sam.shopper@acme.com' };
      const fredSalesman = { name: 'Fred Salesman', email: 'fred.salesman@acme.com' };
      const shoppingListsCreatedByUser = buildShoppingListsCreatedByUserWith({
        data: {
          createdByUser: { results: { createdBy: [samShopper, fredSalesman] } },
        },
      });

      server.use(
        graphql.query('GetQuotesList', () =>
          HttpResponse.json(buildQuotesListB2BWith('WHATEVER_VALUES')),
        ),
        graphql.query('GetShoppingListsCreatedByUser', () =>
          HttpResponse.json(shoppingListsCreatedByUser),
        ),
      );

      renderWithProviders(<QuotesList />, { preloadedState });

      // the filter button is called "edit" for some unknown reason
      await userEvent.click(await screen.findByRole('button', { name: 'edit' }));

      const filterModal = await screen.findByRole('dialog', { name: 'Filters' });

      // selects (comboboxes) are not currently selectable by label
      const createdByStatusSelect = within(filterModal).getAllByRole('combobox')[1];

      await userEvent.click(createdByStatusSelect);

      expect(
        screen.getByRole('option', { name: 'Sam Shopper (sam.shopper@acme.com)' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('option', { name: 'Fred Salesman (fred.salesman@acme.com)' }),
      ).toBeInTheDocument();
    });
  });

  describe('when the "Filters" modal is open and the user clicks "Cancel"', () => {
    it('closes the modal', async () => {
      server.use(
        graphql.query('GetQuotesList', () =>
          HttpResponse.json(buildQuotesListB2BWith('WHATEVER_VALUES')),
        ),
        graphql.query('GetShoppingListsCreatedByUser', () =>
          HttpResponse.json(buildShoppingListsCreatedByUserWith('WHATEVER_VALUES')),
        ),
      );

      renderWithProviders(<QuotesList />, { preloadedState });

      // the filter button is called "edit" for some unknown reason
      await userEvent.click(await screen.findByRole('button', { name: 'edit' }));

      const filterModal = await screen.findByRole('dialog', { name: 'Filters' });

      await userEvent.click(within(filterModal).getByRole('button', { name: 'Cancel' }));

      await waitFor(() => expect(filterModal).not.toBeInTheDocument());
    });
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

describe('when the user is a B2C customer', () => {
  const nonCompany = buildCompanyStateWith({ customer: { b2bId: undefined } });

  const preloadedState = { company: nonCompany, storeInfo: storeInfoWithDateFormat };

  it('displays a table with headings for each key attribute of a quote', async () => {
    const quotesListBC = buildQuotesListBCWith({
      data: { customerQuotes: { totalCount: 1, edges: [buildQuoteEdgeWith('WHATEVER_VALUES')] } },
    });

    server.use(graphql.query('GetQuotesList', () => HttpResponse.json(quotesListBC)));

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

    const quotesListBC = buildQuotesListBCWith({
      data: { customerQuotes: { totalCount: 1, edges: [manySocks] } },
    });

    server.use(graphql.query('GetQuotesList', () => HttpResponse.json(quotesListBC)));

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

    const quotesListBC = buildQuotesListBCWith({
      data: { customerQuotes: { totalCount: 3, edges: [manySocks, someTrousers, oneShirt] } },
    });

    server.use(graphql.query('GetQuotesList', () => HttpResponse.json(quotesListBC)));

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

      const quotesListBC = buildQuotesListBCWith({
        data: { customerQuotes: { totalCount: 3, edges: [someQuote, manySocks, anotherQuote] } },
      });

      server.use(graphql.query('GetQuotesList', () => HttpResponse.json(quotesListBC)));

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

      const quotesListBC = buildQuotesListBCWith({
        data: {
          customerQuotes: { totalCount: 3, edges: [someQuote, workInProgress, anotherQuote] },
        },
      });

      server.use(graphql.query('GetQuotesList', () => HttpResponse.json(quotesListBC)));

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

    const quotesListBC = buildQuotesListBCWith({
      data: {
        customerQuotes: { totalCount: 4, edges: [manySocks, someTrousers, oneShirt, everyHat] },
      },
    });

    server.use(graphql.query('GetQuotesList', () => HttpResponse.json(quotesListBC)));

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

  describe('when the user enters a search term', () => {
    it('displays the quotes that match the search term', async () => {
      const manySocks = buildQuoteEdgeWith({ node: { quoteTitle: 'Many Socks' } });
      const someTrousers = buildQuoteEdgeWith({ node: { quoteTitle: 'Some Trouser' } });

      const allQuotes = buildQuotesListBCWith({
        data: { customerQuotes: { totalCount: 2, edges: [manySocks, someTrousers] } },
      });

      const getQuotesList = vitest.fn<unknown[], QuotesListBC>().mockReturnValue(allQuotes);

      const getQuotesListQuerySpy = vitest.fn();

      server.use(
        graphql.query('GetQuotesList', ({ query }) => {
          getQuotesListQuerySpy(query);

          return HttpResponse.json(getQuotesList());
        }),
      );

      renderWithProviders(<QuotesList />, { preloadedState });

      const searchField = await screen.findByPlaceholderText('Search');
      const table = await screen.findByRole('table');

      expect(within(table).getByRole('row', { name: /Many Socks/ })).toBeInTheDocument();
      expect(within(table).getByRole('row', { name: /Some Trouser/ })).toBeInTheDocument();

      getQuotesList.mockReturnValue(
        buildQuotesListBCWith({
          data: { customerQuotes: { totalCount: 1, edges: [manySocks] } },
        }),
      );

      await userEvent.type(searchField, 'Many Socks');

      await waitFor(() =>
        expect(within(table).queryByRole('row', { name: /Some Trouser/ })).not.toBeInTheDocument(),
      );

      expect(within(table).getByRole('row', { name: /Many Socks/ })).toBeInTheDocument();

      expect(getQuotesListQuerySpy).toHaveBeenLastCalledWith(
        expect.stringContaining('search: "Many Socks"'),
      );
    });
  });

  describe('when the user clears an existing search term', () => {
    it('displays all quotes', async () => {
      const manySocks = buildQuoteEdgeWith({ node: { quoteTitle: 'Many Socks' } });
      const someTrousers = buildQuoteEdgeWith({ node: { quoteTitle: 'Some Trouser' } });

      const allQuotes = buildQuotesListBCWith({
        data: { customerQuotes: { totalCount: 2, edges: [manySocks, someTrousers] } },
      });

      const getQuotesList = vitest.fn<unknown[], QuotesListBC>().mockReturnValue(allQuotes);

      const getQuotesListQuerySpy = vitest.fn();

      server.use(
        graphql.query('GetQuotesList', ({ query }) => {
          getQuotesListQuerySpy(query);

          return HttpResponse.json(getQuotesList());
        }),
      );

      renderWithProviders(<QuotesList />, { preloadedState });

      const searchField = await screen.findByPlaceholderText('Search');
      const table = await screen.findByRole('table');

      getQuotesList.mockReturnValue(
        buildQuotesListBCWith({
          data: { customerQuotes: { totalCount: 1, edges: [manySocks] } },
        }),
      );

      await userEvent.type(searchField, 'Many Socks');

      await waitFor(() =>
        expect(within(table).queryByRole('row', { name: /Some Trouser/ })).not.toBeInTheDocument(),
      );

      getQuotesList.mockReturnValue(buildQuotesListBCWith(allQuotes));

      await userEvent.click(screen.getByTestId('ClearIcon'));

      await waitFor(() =>
        expect(within(table).getByRole('row', { name: /Some Trouser/ })).toBeInTheDocument(),
      );

      expect(within(table).getByRole('row', { name: /Many Socks/ })).toBeInTheDocument();

      expect(getQuotesListQuerySpy).toHaveBeenLastCalledWith(expect.stringContaining('search: ""'));
    });
  });

  describe('when the user filters the quotes by status', () => {
    it('displays the quotes that match the selected status', async () => {
      const manySocks = buildQuoteEdgeWith({ node: { quoteTitle: 'Many Socks', status: 0 } });
      const someTrousers = buildQuoteEdgeWith({
        node: { quoteTitle: 'Some Trouser', status: 1 },
      });

      const allQuotes = buildQuotesListBCWith({
        data: { customerQuotes: { totalCount: 2, edges: [manySocks, someTrousers] } },
      });

      const getQuotesList = vitest.fn<unknown[], QuotesListBC>().mockReturnValue(allQuotes);
      const getQuotesListQuerySpy = vitest.fn();

      server.use(
        graphql.query('GetQuotesList', ({ query }) => {
          getQuotesListQuerySpy(query);

          return HttpResponse.json(getQuotesList());
        }),
      );

      renderWithProviders(<QuotesList />, { preloadedState });

      const table = await screen.findByRole('table');

      expect(within(table).getByRole('row', { name: /Many Socks/ })).toBeInTheDocument();
      expect(within(table).getByRole('row', { name: /Some Trouser/ })).toBeInTheDocument();

      // the filter button is called "edit" for some unknown reason
      await userEvent.click(screen.getByRole('button', { name: 'edit' }));

      const filterModal = await screen.findByRole('dialog', { name: 'Filters' });

      // selects (comboboxes) are not currently selectable by label
      const quoteStatusSelect = within(filterModal).getAllByRole('combobox')[0];

      await userEvent.click(quoteStatusSelect);

      await userEvent.click(screen.getByRole('option', { name: 'Open' }));

      getQuotesList.mockReturnValue(
        buildQuotesListBCWith({
          data: { customerQuotes: { totalCount: 1, edges: [someTrousers] } },
        }),
      );

      await userEvent.click(within(filterModal).getByRole('button', { name: 'Apply' }));

      await waitFor(() =>
        expect(within(table).queryByRole('row', { name: /Many Socks/ })).not.toBeInTheDocument(),
      );

      expect(within(table).getByRole('row', { name: /Some Trouser/ })).toBeInTheDocument();

      expect(getQuotesListQuerySpy).toHaveBeenLastCalledWith(
        expect.stringContaining('status: "1"'),
      );
    });
  });

  describe('when filters are applied and the user clicks "Clear Filters" button', () => {
    it('displays all quotes and does not display the "Clear Filters" button', async () => {
      const manySocks = buildQuoteEdgeWith({ node: { quoteTitle: 'Many Socks', status: 0 } });
      const someTrousers = buildQuoteEdgeWith({
        node: { quoteTitle: 'Some Trouser', status: 1 },
      });

      const allQuotes = buildQuotesListBCWith({
        data: { customerQuotes: { totalCount: 2, edges: [manySocks, someTrousers] } },
      });

      const getQuotesList = vitest.fn<unknown[], QuotesListBC>().mockReturnValue(allQuotes);
      const getQuotesListQuerySpy = vitest.fn();

      server.use(
        graphql.query('GetQuotesList', ({ query }) => {
          getQuotesListQuerySpy(query);

          return HttpResponse.json(getQuotesList());
        }),
      );

      renderWithProviders(<QuotesList />, { preloadedState });

      // the filter button is called "edit" for some unknown reason
      await userEvent.click(await screen.findByRole('button', { name: 'edit' }));

      const filterModal = await screen.findByRole('dialog', { name: 'Filters' });

      // selects (comboboxes) are not currently selectable by label
      const quoteStatusSelect = within(filterModal).getAllByRole('combobox')[0];

      await userEvent.click(quoteStatusSelect);

      await userEvent.click(screen.getByRole('option', { name: 'Open' }));

      getQuotesList.mockReturnValue(
        buildQuotesListBCWith({
          data: { customerQuotes: { totalCount: 1, edges: [someTrousers] } },
        }),
      );

      await userEvent.click(within(filterModal).getByRole('button', { name: 'Apply' }));

      const table = await screen.findByRole('table');

      await waitFor(() =>
        expect(within(table).queryByRole('row', { name: /Many Socks/ })).not.toBeInTheDocument(),
      );

      // the filter button is called "clear-edit" for some unknown reason
      const clearFiltersButton = screen.getByRole('button', { name: 'clear-edit' });

      getQuotesList.mockReturnValue(buildQuotesListBCWith(allQuotes));

      await userEvent.click(clearFiltersButton);

      await waitFor(() => expect(clearFiltersButton).not.toBeInTheDocument());
      expect(within(table).getByRole('row', { name: /Many Socks/ })).toBeInTheDocument();
      expect(within(table).getByRole('row', { name: /Some Trouser/ })).toBeInTheDocument();

      expect(getQuotesListQuerySpy).toHaveBeenLastCalledWith(
        expect.not.stringContaining('status: "1"'),
      );
    });
  });

  describe('when the Filters modal is open', () => {
    it('does not display a list of user options to filter by', async () => {
      server.use(
        graphql.query('GetQuotesList', () =>
          HttpResponse.json(buildQuotesListBCWith('WHATEVER_VALUES')),
        ),
      );

      renderWithProviders(<QuotesList />, { preloadedState });

      // the filter button is called "edit" for some unknown reason
      await userEvent.click(await screen.findByRole('button', { name: 'edit' }));

      const filterModal = await screen.findByRole('dialog', { name: 'Filters' });

      // selects (comboboxes) are not currently selectable by label
      expect(within(filterModal).queryByText('Created by')).not.toBeInTheDocument();
    });
  });

  describe('when the "Filters" modal is open and the user clicks "Cancel"', () => {
    it('closes the modal', async () => {
      server.use(
        graphql.query('GetQuotesList', () =>
          HttpResponse.json(buildQuotesListBCWith('WHATEVER_VALUES')),
        ),
      );

      renderWithProviders(<QuotesList />, { preloadedState });

      // the filter button is called "edit" for some unknown reason
      await userEvent.click(await screen.findByRole('button', { name: 'edit' }));

      const filterModal = await screen.findByRole('dialog', { name: 'Filters' });

      await userEvent.click(within(filterModal).getByRole('button', { name: 'Cancel' }));

      await waitFor(() => expect(filterModal).not.toBeInTheDocument());
    });
  });

  describe('when the user has no quotes', () => {
    it('displays a message of "No data" and does not display the quotes table', async () => {
      const quotesListB2B = buildQuotesListBCWith({
        data: { customerQuotes: { totalCount: 0, edges: [] } },
      });

      server.use(graphql.query('GetQuotesList', () => HttpResponse.json(quotesListB2B)));

      renderWithProviders(<QuotesList />, { preloadedState });

      expect(await screen.findByText('No data')).toBeInTheDocument();
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });
  });
});
