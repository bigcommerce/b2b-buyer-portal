import { PersistPartial } from 'redux-persist/es/persistReducer';
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

import {
  QuoteEdge,
  QuotesListB2B,
  QuotesListBC,
  QuoteStatus,
} from '@/shared/service/b2b/graphql/quote';
import { ShoppingListsCreatedByUser } from '@/shared/service/b2b/graphql/shoppingList';
import { QuoteInfoState } from '@/store/slices/quoteInfo';
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
    quoteNumber: faker.number.int().toString(),
    quoteTitle: faker.commerce.productName(),
    referenceNumber: faker.number.int().toString(),
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
    status: faker.helpers.enumValue(QuoteStatus),
    salesRep: faker.person.fullName(),
    salesRepEmail: faker.internet.email(),
    orderId: faker.string.uuid(),
    subtotal: faker.commerce.price(),
    totalAmount: faker.commerce.price(),
    taxTotal: faker.commerce.price(),
    uuid: undefined,
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

type QuoteItem = QuoteInfoState['draftQuoteList'][number];

const productSearchItem = builder<QuoteItem['node']['productsSearch']>(() => ({
  id: faker.number.int(),
  name: faker.commerce.productName(),
  sku: faker.string.uuid(),
  base_price: faker.commerce.price(),
  costPrice: faker.commerce.price(),
  channelId: [faker.number.int()],
  selectOptions: faker.commerce.productAdjective(),
  inventoryLevel: faker.number.int(),
  inventoryTracking: faker.helpers.arrayElement(['none', 'product', 'variant']),
  availability: faker.helpers.arrayElement(['in stock', 'out of stock', 'preorder']),
  orderQuantityMinimum: faker.number.int(),
  orderQuantityMaximum: faker.number.int(),
  variants: [],
  currencyCode: faker.finance.currencyCode(),
  imageUrl: faker.image.url(),
  modifiers: [],
  options: [],
  optionsV3: [],
  allOptions: [],
  productUrl: faker.internet.url(),
  quantity: faker.number.int(),
  product_options: [],
  availableToSell: faker.number.int(),
  unlimitedBackorder: faker.datatype.boolean(),
}));

const buildDraftQuoteItemWith = builder<QuoteItem>(() => ({
  node: {
    id: faker.string.uuid(),
    productId: faker.number.int(),
    productName: faker.commerce.productName(),
    quantity: faker.number.int({ min: 1, max: 100 }),
    basePrice: faker.number.int(),
    optionList: faker.lorem.word(),
    taxPrice: faker.number.int(),
    calculatedValue: {},
    productsSearch: productSearchItem('WHATEVER_VALUES'),
  },
}));

type Address =
  | QuoteInfoState['draftQuoteInfo']['billingAddress']
  | QuoteInfoState['draftQuoteInfo']['shippingAddress'];

const buildAddressWith = builder<Address>(() => ({
  companyName: faker.company.name(),
  city: faker.location.city(),
  label: faker.lorem.word(),
  state: faker.location.state(),
  address: faker.location.streetAddress(),
  country: faker.location.country(),
  zipCode: faker.location.zipCode(),
  lastName: faker.person.lastName(),
  addressId: faker.number.int(),
  apartment: faker.location.secondaryAddress(),
  firstName: faker.person.firstName(),
  phoneNumber: faker.phone.number(),
  addressLabel: faker.lorem.word(),
}));

const buildQuoteInfoStateWith = builder<QuoteInfoState & PersistPartial>(() => ({
  draftQuoteList: bulk(buildDraftQuoteItemWith, 'WHATEVER_VALUES').times(
    faker.number.int({ min: 1, max: 12 }),
  ),
  draftQuoteInfo: {
    userId: faker.number.int(),
    contactInfo: {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      companyName: faker.company.name(),
      phoneNumber: faker.phone.number(),
    },
    shippingAddress: buildAddressWith('WHATEVER_VALUES'),
    billingAddress: buildAddressWith('WHATEVER_VALUES'),
    fileInfo: [],
    note: faker.lorem.sentence(),
    referenceNumber: faker.number.int().toString(),
    extraFields: [],
    recipients: [],
  },
  quoteDetailToCheckoutUrl: faker.internet.url(),
  _persist: { version: 1, rehydrated: true },
}));

const { server } = startMockServer();

const storeInfoWithDateFormat = buildStoreInfoStateWith({ timeFormat: { display: 'j F Y' } });

describe('when the user is a B2B customer', () => {
  const approvedB2BCompany = buildCompanyStateWith({
    companyInfo: { status: CompanyStatus.APPROVED },
    customer: { userType: UserTypes.MULTIPLE_B2C, firstName: 'John', lastName: 'Doe' },
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
        status: QuoteStatus.OPEN,
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
          status: QuoteStatus.OPEN,
          uuid: undefined,
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

      expect(navigation).toHaveBeenCalledWith(`/quoteDetail/939232?date=1735689600`);
    });

    it('navigates with UUID parameter when quote has a UUID', async () => {
      const quoteWithUuid = buildQuoteEdgeWith({
        node: {
          quoteTitle: 'Quote with UUID',
          id: '123456',
          createdAt: getUnixTime(new Date('1 January 2025')),
          uuid: 'abc-123-def-456',
          status: QuoteStatus.OPEN,
        },
      });

      const quotesListB2B = buildQuotesListB2BWith({
        data: { quotes: { totalCount: 1, edges: [quoteWithUuid] } },
      });

      server.use(
        graphql.query('GetQuotesList', () => HttpResponse.json(quotesListB2B)),
        graphql.query('GetShoppingListsCreatedByUser', () =>
          HttpResponse.json(buildShoppingListsCreatedByUserWith('WHATEVER_VALUES')),
        ),
      );

      const { navigation } = renderWithProviders(<QuotesList />, { preloadedState });

      const table = await screen.findByRole('table');

      await userEvent.click(within(table).getByRole('row', { name: /Quote with UUID/ }));

      expect(navigation).toHaveBeenCalledWith(
        `/quoteDetail/123456?date=1735689600&uuid=abc-123-def-456`,
      );
    });

    it('navigates without UUID parameter when quote has no UUID (backward compatibility)', async () => {
      const quoteWithoutUuid = buildQuoteEdgeWith({
        node: {
          quoteTitle: 'Quote without UUID',
          id: '789012',
          createdAt: getUnixTime(new Date('2 January 2025')),
          status: QuoteStatus.OPEN,
          uuid: undefined,
        },
      });

      const quotesListB2B = buildQuotesListB2BWith({
        data: { quotes: { totalCount: 1, edges: [quoteWithoutUuid] } },
      });

      server.use(
        graphql.query('GetQuotesList', () => HttpResponse.json(quotesListB2B)),
        graphql.query('GetShoppingListsCreatedByUser', () =>
          HttpResponse.json(buildShoppingListsCreatedByUserWith('WHATEVER_VALUES')),
        ),
      );

      const { navigation } = renderWithProviders(<QuotesList />, { preloadedState });

      const table = await screen.findByRole('table');

      await userEvent.click(within(table).getByRole('row', { name: /Quote without UUID/ }));

      expect(navigation).toHaveBeenCalledWith(
        `/quoteDetail/789012?date=${getUnixTime(new Date('2 January 2025'))}`,
      );
    });
  });

  describe('when the user has a draft quote', () => {
    it('displays the draft quote details at the top of the list', async () => {
      const someSavedQuote = buildQuoteEdgeWith({ node: { quoteTitle: 'Some Saved Quote' } });
      const quotesListB2B = buildQuotesListB2BWith({
        data: { quotes: { totalCount: 1, edges: [someSavedQuote] } },
      });

      server.use(
        graphql.query('GetQuotesList', () => HttpResponse.json(quotesListB2B)),
        graphql.query('GetShoppingListsCreatedByUser', () =>
          HttpResponse.json(buildShoppingListsCreatedByUserWith('WHATEVER_VALUES')),
        ),
      );

      const someDraftQuoteItem = buildDraftQuoteItemWith({
        node: { basePrice: 23, taxPrice: 0, quantity: 2 },
      });
      const anotherDraftQuoteItem = buildDraftQuoteItemWith({
        node: { basePrice: 77, taxPrice: 0, quantity: 2 },
      });

      const quoteInfo = buildQuoteInfoStateWith({
        draftQuoteList: [someDraftQuoteItem, anotherDraftQuoteItem],
      });

      renderWithProviders(<QuotesList />, {
        preloadedState: { ...preloadedState, quoteInfo },
      });

      const table = await screen.findByRole('table');
      const allRows = within(table).getAllByRole('row');

      const rowOfDraftQuote = within(table).getByRole('row', { name: /Draft/ });
      const rowOfSomeSavedQuote = within(table).getByRole('row', {
        name: /Some Saved Quote/,
      });

      // Row 0 is the header row
      expect(allRows[1]).toBe(rowOfDraftQuote);
      expect(allRows[2]).toBe(rowOfSomeSavedQuote);

      const allDraftQuoteCells = within(rowOfDraftQuote).getAllByRole('cell');

      // Quote #
      expect(allDraftQuoteCells[0]).toHaveTextContent('—');
      // Title
      expect(allDraftQuoteCells[1]).toHaveTextContent('—');
      // Sales rep
      expect(allDraftQuoteCells[2]).toHaveTextContent('—');
      // Draft quotes are created by the current user in state
      expect(allDraftQuoteCells[3]).toHaveTextContent('John Doe');
      // Date created
      expect(allDraftQuoteCells[4]).toHaveTextContent('—');
      // Last update
      expect(allDraftQuoteCells[5]).toHaveTextContent('—');
      // Expiration date
      expect(allDraftQuoteCells[6]).toHaveTextContent('—');
      // Subtotal is the sum of all the items in the draft quote
      expect(allDraftQuoteCells[7]).toHaveTextContent('$200.00');
    });
  });

  describe('when clicking on the row of the draft quote', () => {
    // A user can only ever have one draft quote at a time
    it('navigates to the quote draft page', async () => {
      server.use(
        graphql.query('GetQuotesList', () =>
          HttpResponse.json(
            buildQuotesListB2BWith({ data: { quotes: { totalCount: 0, edges: [] } } }),
          ),
        ),
        graphql.query('GetShoppingListsCreatedByUser', () =>
          HttpResponse.json(buildShoppingListsCreatedByUserWith('WHATEVER_VALUES')),
        ),
      );

      const quoteInfo = buildQuoteInfoStateWith({
        draftQuoteList: [buildDraftQuoteItemWith('WHATEVER_VALUES')],
      });

      const { navigation } = renderWithProviders(<QuotesList />, {
        preloadedState: { ...preloadedState, quoteInfo },
      });

      const table = await screen.findByRole('table');

      await userEvent.click(within(table).getByRole('row', { name: /Draft/ }));

      expect(navigation).toHaveBeenCalledWith('/quoteDraft');
    });
  });

  it('displays the current status of each quote', async () => {
    const someTrousers = buildQuoteEdgeWith({
      node: { quoteTitle: 'Some Trouser', status: QuoteStatus.OPEN },
    });
    const oneShirt = buildQuoteEdgeWith({
      node: { quoteTitle: 'One Shirt', status: QuoteStatus.ORDERED },
    });
    const everyHat = buildQuoteEdgeWith({
      node: { quoteTitle: 'Every Hat', status: QuoteStatus.EXPIRED },
    });

    const quotesListB2B = buildQuotesListB2BWith({
      data: { quotes: { totalCount: 4, edges: [someTrousers, oneShirt, everyHat] } },
    });

    server.use(
      graphql.query('GetQuotesList', () => HttpResponse.json(quotesListB2B)),
      graphql.query('GetShoppingListsCreatedByUser', () =>
        HttpResponse.json(buildShoppingListsCreatedByUserWith('WHATEVER_VALUES')),
      ),
    );

    renderWithProviders(<QuotesList />, { preloadedState });

    const table = await screen.findByRole('table');

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

      const getQuotesList = vitest
        .fn<(...args: unknown[]) => QuotesListB2B>()
        .mockReturnValue(allQuotes);

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

      const getQuotesList = vitest
        .fn<(...args: unknown[]) => QuotesListB2B>()
        .mockReturnValue(allQuotes);

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
      const manySocks = buildQuoteEdgeWith({
        node: { quoteTitle: 'Many Socks', status: QuoteStatus.EXPIRED },
      });
      const someTrousers = buildQuoteEdgeWith({
        node: { quoteTitle: 'Some Trouser', status: QuoteStatus.OPEN },
      });

      const allQuotes = buildQuotesListB2BWith({
        data: { quotes: { totalCount: 2, edges: [manySocks, someTrousers] } },
      });

      const getQuotesList = vitest
        .fn<(...args: unknown[]) => QuotesListB2B>()
        .mockReturnValue(allQuotes);
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
      const manySocks = buildQuoteEdgeWith({
        node: { quoteTitle: 'Many Socks', status: QuoteStatus.EXPIRED },
      });
      const someTrousers = buildQuoteEdgeWith({
        node: { quoteTitle: 'Some Trouser', status: QuoteStatus.OPEN },
      });

      const allQuotes = buildQuotesListB2BWith({
        data: { quotes: { totalCount: 2, edges: [manySocks, someTrousers] } },
      });

      const getQuotesList = vitest
        .fn<(...args: unknown[]) => QuotesListB2B>()
        .mockReturnValue(allQuotes);
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
        status: QuoteStatus.OPEN,
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
          status: QuoteStatus.OPEN,
          uuid: undefined,
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

      expect(navigation).toHaveBeenCalledWith(`/quoteDetail/939232?date=1735689600`);
    });

    it('navigates with UUID parameter when quote has a UUID', async () => {
      const quoteWithUuid = buildQuoteEdgeWith({
        node: {
          quoteTitle: 'Quote with UUID',
          id: '123456',
          createdAt: getUnixTime(new Date('1 January 2025')),
          uuid: 'abc-123-def-456',
          status: QuoteStatus.OPEN,
        },
      });

      const quotesListBC = buildQuotesListBCWith({
        data: { customerQuotes: { totalCount: 1, edges: [quoteWithUuid] } },
      });

      server.use(graphql.query('GetQuotesList', () => HttpResponse.json(quotesListBC)));

      const { navigation } = renderWithProviders(<QuotesList />, { preloadedState });

      const table = await screen.findByRole('table');

      await userEvent.click(within(table).getByRole('row', { name: /Quote with UUID/ }));

      expect(navigation).toHaveBeenCalledWith(
        `/quoteDetail/123456?date=1735689600&uuid=abc-123-def-456`,
      );
    });

    it('navigates without UUID parameter when quote has no UUID (backward compatibility)', async () => {
      const quoteWithoutUuid = buildQuoteEdgeWith({
        node: {
          quoteTitle: 'Quote without UUID',
          id: '789012',
          createdAt: getUnixTime(new Date('2 January 2025')),
          status: QuoteStatus.OPEN,
          uuid: undefined,
        },
      });

      const quotesListBC = buildQuotesListBCWith({
        data: { customerQuotes: { totalCount: 1, edges: [quoteWithoutUuid] } },
      });

      server.use(graphql.query('GetQuotesList', () => HttpResponse.json(quotesListBC)));

      const { navigation } = renderWithProviders(<QuotesList />, { preloadedState });

      const table = await screen.findByRole('table');

      await userEvent.click(within(table).getByRole('row', { name: /Quote without UUID/ }));

      expect(navigation).toHaveBeenCalledWith(
        `/quoteDetail/789012?date=${getUnixTime(new Date('2 January 2025'))}`,
      );
    });
  });

  it('displays the current status of each quote', async () => {
    const someTrousers = buildQuoteEdgeWith({
      node: { quoteTitle: 'Some Trouser', status: QuoteStatus.OPEN },
    });
    const oneShirt = buildQuoteEdgeWith({
      node: { quoteTitle: 'One Shirt', status: QuoteStatus.ORDERED },
    });
    const everyHat = buildQuoteEdgeWith({
      node: { quoteTitle: 'Every Hat', status: QuoteStatus.EXPIRED },
    });

    const quotesListBC = buildQuotesListBCWith({
      data: {
        customerQuotes: { totalCount: 4, edges: [someTrousers, oneShirt, everyHat] },
      },
    });

    server.use(graphql.query('GetQuotesList', () => HttpResponse.json(quotesListBC)));

    renderWithProviders(<QuotesList />, { preloadedState });

    const table = await screen.findByRole('table');

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

      const getQuotesList = vitest
        .fn<(...args: unknown[]) => QuotesListBC>()
        .mockReturnValue(allQuotes);

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

      const getQuotesList = vitest
        .fn<(...args: unknown[]) => QuotesListBC>()
        .mockReturnValue(allQuotes);

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
      const manySocks = buildQuoteEdgeWith({
        node: { quoteTitle: 'Many Socks', status: QuoteStatus.EXPIRED },
      });
      const someTrousers = buildQuoteEdgeWith({
        node: { quoteTitle: 'Some Trouser', status: QuoteStatus.OPEN },
      });

      const allQuotes = buildQuotesListBCWith({
        data: { customerQuotes: { totalCount: 2, edges: [manySocks, someTrousers] } },
      });

      const getQuotesList = vitest
        .fn<(...args: unknown[]) => QuotesListBC>()
        .mockReturnValue(allQuotes);
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
      const manySocks = buildQuoteEdgeWith({
        node: { quoteTitle: 'Many Socks', status: QuoteStatus.EXPIRED },
      });
      const someTrousers = buildQuoteEdgeWith({
        node: { quoteTitle: 'Some Trouser', status: QuoteStatus.OPEN },
      });

      const allQuotes = buildQuotesListBCWith({
        data: { customerQuotes: { totalCount: 2, edges: [manySocks, someTrousers] } },
      });

      const getQuotesList = vitest
        .fn<(...args: unknown[]) => QuotesListBC>()
        .mockReturnValue(allQuotes);
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
