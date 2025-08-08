import { PersistPartial } from 'redux-persist/es/persistReducer';
import {
  buildCompanyStateWith,
  builder,
  buildStoreInfoStateWith,
  bulk,
  faker,
  graphql,
  HttpResponse,
  renderWithProviders,
  screen,
  startMockServer,
  within,
} from 'tests/test-utils';

import { QuoteInfoState } from '@/store/slices/quoteInfo';
import { CompanyStatus, UserTypes } from '@/types';
import { QuoteInfo, QuoteItem } from '@/types/quotes';

import QuoteDraft from '.';

const { server } = startMockServer();

const buildProductWith = builder<QuoteItem['node']['productsSearch']>(() => ({
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
}));

const buildDraftQuoteItemWith = builder<QuoteItem>(() => ({
  node: {
    id: faker.number.int().toString(),
    basePrice: faker.number.int(),
    quantity: faker.number.int(),
    variantId: faker.number.int(),
    primaryImage: faker.image.url(),
    optionList: JSON.stringify(
      Array.from({ length: faker.number.int({ min: 0, max: 10 }) }, () => ({
        type: faker.lorem.word(),
        optionId: faker.number.int(),
        optionName: faker.lorem.word(),
        optionLabel: faker.commerce.productMaterial(),
        optionValue: faker.lorem.word(),
      })),
    ),
    productName: faker.commerce.productName(),
    taxPrice: faker.number.int(),
    calculatedValue: {},
    productsSearch: buildProductWith('WHATEVER_VALUES'),
  },
}));

type Address = QuoteInfo['billingAddress'] | QuoteInfo['shippingAddress'];

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

const approvedB2BCompany = buildCompanyStateWith({
  companyInfo: { status: CompanyStatus.APPROVED },
  customer: { userType: UserTypes.MULTIPLE_B2C },
});

const storeInfoWithDateFormat = buildStoreInfoStateWith({ timeFormat: { display: 'j F Y' } });

const preloadedState = { company: approvedB2BCompany, storeInfo: storeInfoWithDateFormat };

it('displays a page title of "Quote" and label "Draft"', async () => {
  server.use(
    graphql.query('Countries', () => HttpResponse.json({ data: { countries: [] } })),
    graphql.query('Addresses', () =>
      HttpResponse.json({ data: { addresses: { totalCount: 0, edges: [] } } }),
    ),
    graphql.query('getQuoteExtraFields', () =>
      HttpResponse.json({ data: { quoteExtraFieldsConfig: [] } }),
    ),
  );

  renderWithProviders(<QuoteDraft setOpenPage={vi.fn()} />, { preloadedState });

  expect(await screen.findByRole('heading', { name: 'Quote' })).toBeInTheDocument();
  expect(screen.getByText('Draft')).toBeInTheDocument();
});

it('displays a summary of the products within the quote draft', async () => {
  server.use(
    graphql.query('Countries', () => HttpResponse.json({ data: { countries: [] } })),
    graphql.query('Addresses', () =>
      HttpResponse.json({ data: { addresses: { totalCount: 0, edges: [] } } }),
    ),
    graphql.query('getQuoteExtraFields', () =>
      HttpResponse.json({ data: { quoteExtraFieldsConfig: [] } }),
    ),
  );

  const woolSocks = buildDraftQuoteItemWith({
    node: { productName: 'Wool Socks', basePrice: 49, quantity: 10 },
  });
  const denimJacket = buildDraftQuoteItemWith({
    node: { productName: 'Denim Jacket', basePrice: 133.33, quantity: 3 },
  });

  const quoteInfo = buildQuoteInfoStateWith({ draftQuoteList: [woolSocks, denimJacket] });

  renderWithProviders(<QuoteDraft setOpenPage={vi.fn()} />, {
    preloadedState: { ...preloadedState, quoteInfo },
  });

  expect(await screen.findByText('2 products')).toBeInTheDocument();

  const rowOfWoolSocks = screen.getByRole('row', { name: /Wool Socks/ });

  expect(within(rowOfWoolSocks).getByRole('cell', { name: '$49.00' })).toBeInTheDocument();
  expect(within(rowOfWoolSocks).getByRole('cell', { name: '10' })).toBeInTheDocument();
  expect(within(rowOfWoolSocks).getByRole('cell', { name: '$490.00' })).toBeInTheDocument();

  const rowOfDenimJacket = screen.getByRole('row', { name: /Denim Jacket/ });

  expect(within(rowOfDenimJacket).getByRole('cell', { name: '$133.33' })).toBeInTheDocument();
  expect(within(rowOfDenimJacket).getByRole('cell', { name: '3' })).toBeInTheDocument();
  expect(within(rowOfDenimJacket).getByRole('cell', { name: '$399.99' })).toBeInTheDocument();
});

it('displays a quote summary', async () => {
  server.use(
    graphql.query('Countries', () => HttpResponse.json({ data: { countries: [] } })),
    graphql.query('Addresses', () =>
      HttpResponse.json({ data: { addresses: { totalCount: 0, edges: [] } } }),
    ),
    graphql.query('getQuoteExtraFields', () =>
      HttpResponse.json({ data: { quoteExtraFieldsConfig: [] } }),
    ),
  );

  const smallHats = buildDraftQuoteItemWith({
    node: { basePrice: 20, quantity: 2, taxPrice: 7.5 },
  });
  const bigHat = buildDraftQuoteItemWith({
    node: { basePrice: 60, quantity: 1, taxPrice: 10 },
  });

  const quoteInfo = buildQuoteInfoStateWith({
    draftQuoteList: [smallHats, bigHat],
    draftQuoteInfo: { shippingAddress: undefined },
  });

  renderWithProviders(<QuoteDraft setOpenPage={vi.fn()} />, {
    preloadedState: { ...preloadedState, quoteInfo },
  });

  const quoteSummary = await screen.findByRole('article', { name: 'Quote summary' });

  expect(within(quoteSummary).getByText('Sub total')).toBeInTheDocument();
  expect(within(quoteSummary).getByText('$100.00')).toBeInTheDocument();

  expect(within(quoteSummary).getByText('Shipping')).toBeInTheDocument();
  expect(within(quoteSummary).getByText('TBD')).toBeInTheDocument();

  expect(within(quoteSummary).getByText('Estimated Tax')).toBeInTheDocument();
  expect(within(quoteSummary).getByText('$25.00')).toBeInTheDocument();

  expect(within(quoteSummary).getByText('Grand total')).toBeInTheDocument();
  expect(within(quoteSummary).getByText('$125.00')).toBeInTheDocument();
});

it('displays the buyer info', async () => {
  server.use(
    graphql.query('Countries', () => HttpResponse.json({ data: { countries: [] } })),
    graphql.query('Addresses', () =>
      HttpResponse.json({ data: { addresses: { totalCount: 0, edges: [] } } }),
    ),
    graphql.query('getQuoteExtraFields', () =>
      HttpResponse.json({ data: { quoteExtraFieldsConfig: [] } }),
    ),
  );

  const quoteInfo = buildQuoteInfoStateWith({
    draftQuoteInfo: {
      contactInfo: {
        name: 'Joey Johnson',
        email: 'joey.johnson@abc.com',
        companyName: 'ABC Inc',
        phoneNumber: '04747666333',
      },
    },
  });

  renderWithProviders(<QuoteDraft setOpenPage={vi.fn()} />, {
    preloadedState: { ...preloadedState, quoteInfo },
  });

  const buyerInfo = await screen.findByRole('article', { name: 'Buyer info' });

  expect(within(buyerInfo).getByText('Joey Johnson')).toBeInTheDocument();
  expect(within(buyerInfo).getByText('joey.johnson@abc.com')).toBeInTheDocument();
  expect(within(buyerInfo).getByText('ABC Inc')).toBeInTheDocument();
  expect(within(buyerInfo).getByText('04747666333')).toBeInTheDocument();
});

describe('when there is a billing address assigned', () => {
  it('displays the billing address', async () => {
    server.use(
      graphql.query('Countries', () => HttpResponse.json({ data: { countries: [] } })),
      graphql.query('Addresses', () =>
        HttpResponse.json({ data: { addresses: { totalCount: 0, edges: [] } } }),
      ),
      graphql.query('getQuoteExtraFields', () =>
        HttpResponse.json({ data: { quoteExtraFieldsConfig: [] } }),
      ),
    );

    const quoteInfo = buildQuoteInfoStateWith({
      draftQuoteInfo: {
        billingAddress: buildAddressWith({
          label: 'ABC Inc Headquarters',
          firstName: 'Joey',
          lastName: 'Johnson',
          address: '123 Main St',
          apartment: 'Apt 4B',
          city: 'Springfield',
          state: 'IL',
          zipCode: '62701',
          country: 'USA',
          phoneNumber: '04747666333',
        }),
      },
    });

    renderWithProviders(<QuoteDraft setOpenPage={vi.fn()} />, {
      preloadedState: { ...preloadedState, quoteInfo },
    });

    const billing = await screen.findByRole('article', { name: 'Billing' });

    expect(within(billing).getByText('ABC Inc Headquarters')).toBeInTheDocument();
    expect(within(billing).getByText('Joey Johnson')).toBeInTheDocument();
    expect(within(billing).getByText('123 Main St')).toBeInTheDocument();
    expect(within(billing).getByText('Apt 4B')).toBeInTheDocument();
    expect(within(billing).getByText('Springfield, IL, 62701, USA')).toBeInTheDocument();
    expect(within(billing).getByText('04747666333')).toBeInTheDocument();
  });
});

describe('when there is no billing address assigned', () => {
  it('displays a message of "Please add billing address"', async () => {
    server.use(
      graphql.query('Countries', () => HttpResponse.json({ data: { countries: [] } })),
      graphql.query('Addresses', () =>
        HttpResponse.json({ data: { addresses: { totalCount: 0, edges: [] } } }),
      ),
      graphql.query('getQuoteExtraFields', () =>
        HttpResponse.json({ data: { quoteExtraFieldsConfig: [] } }),
      ),
    );

    const quoteInfo = buildQuoteInfoStateWith({
      draftQuoteInfo: {
        // a missing address is modeled like this :'(
        billingAddress: buildAddressWith({
          label: '',
          firstName: '',
          lastName: '',
          address: '',
          apartment: '',
          city: '',
          state: '',
          zipCode: '',
          country: '',
          phoneNumber: '',
        }),
      },
    });

    renderWithProviders(<QuoteDraft setOpenPage={vi.fn()} />, {
      preloadedState: { ...preloadedState, quoteInfo },
    });

    const billing = await screen.findByRole('article', { name: 'Billing' });

    expect(within(billing).getByText('Please add billing address')).toBeInTheDocument();
  });
});

describe('when there is a shipping address assigned', () => {
  it('displays the shipping address', async () => {
    server.use(
      graphql.query('Countries', () => HttpResponse.json({ data: { countries: [] } })),
      graphql.query('Addresses', () =>
        HttpResponse.json({ data: { addresses: { totalCount: 0, edges: [] } } }),
      ),
      graphql.query('getQuoteExtraFields', () =>
        HttpResponse.json({ data: { quoteExtraFieldsConfig: [] } }),
      ),
    );

    const quoteInfo = buildQuoteInfoStateWith({
      draftQuoteInfo: {
        shippingAddress: buildAddressWith({
          label: 'My Home',
          firstName: 'Joey',
          lastName: 'Johnson',
          address: '456 Elm St',
          apartment: 'Suite 5',
          city: 'Springfield',
          state: 'IL',
          zipCode: '62702',
          country: 'USA',
          phoneNumber: '04747666333',
        }),
      },
    });

    renderWithProviders(<QuoteDraft setOpenPage={vi.fn()} />, {
      preloadedState: { ...preloadedState, quoteInfo },
    });

    const shipping = await screen.findByRole('article', { name: 'Shipping' });

    expect(within(shipping).getByText('My Home')).toBeInTheDocument();
    expect(within(shipping).getByText('Joey Johnson')).toBeInTheDocument();
    expect(within(shipping).getByText('456 Elm St')).toBeInTheDocument();
    expect(within(shipping).getByText('Suite 5')).toBeInTheDocument();
    expect(within(shipping).getByText('Springfield, IL, 62702, USA')).toBeInTheDocument();
    expect(within(shipping).getByText('04747666333')).toBeInTheDocument();
  });
});

describe('when there is no shipping address assigned', () => {
  it('displays a message of "Please add shipping address"', async () => {
    server.use(
      graphql.query('Countries', () => HttpResponse.json({ data: { countries: [] } })),
      graphql.query('Addresses', () =>
        HttpResponse.json({ data: { addresses: { totalCount: 0, edges: [] } } }),
      ),
      graphql.query('getQuoteExtraFields', () =>
        HttpResponse.json({ data: { quoteExtraFieldsConfig: [] } }),
      ),
    );

    const quoteInfo = buildQuoteInfoStateWith({
      draftQuoteInfo: {
        // a missing address is modeled like this :'(
        shippingAddress: buildAddressWith({
          label: '',
          firstName: '',
          lastName: '',
          address: '',
          apartment: '',
          city: '',
          state: '',
          zipCode: '',
          country: '',
          phoneNumber: '',
        }),
      },
    });

    renderWithProviders(<QuoteDraft setOpenPage={vi.fn()} />, {
      preloadedState: { ...preloadedState, quoteInfo },
    });

    const shipping = await screen.findByRole('article', { name: 'Shipping' });

    expect(within(shipping).getByText('Please add shipping address')).toBeInTheDocument();
  });
});

it('displays the quote info"', async () => {
  server.use(
    graphql.query('Countries', () => HttpResponse.json({ data: { countries: [] } })),
    graphql.query('Addresses', () =>
      HttpResponse.json({ data: { addresses: { totalCount: 0, edges: [] } } }),
    ),
    graphql.query('getQuoteExtraFields', () =>
      HttpResponse.json({ data: { quoteExtraFieldsConfig: [] } }),
    ),
  );

  const quoteInfo = buildQuoteInfoStateWith({
    draftQuoteInfo: {
      contactInfo: { quoteTitle: 'Some lovely things' },
      recipients: ['billy.bully@acme.com', 'terry.trousers@acme.com'],
      referenceNumber: 'REF123456',
    },
  });

  renderWithProviders(<QuoteDraft setOpenPage={vi.fn()} />, {
    preloadedState: { ...preloadedState, quoteInfo },
  });

  const info = await screen.findByRole('article', { name: 'Quote info' });

  expect(within(info).getByText('Title: Some lovely things')).toBeInTheDocument();
  expect(within(info).getByText('Reference: REF123456')).toBeInTheDocument();
  expect(within(info).getByText('CC: billy.bully@acme.com')).toBeInTheDocument();
  expect(within(info).getByText('CC: terry.trousers@acme.com')).toBeInTheDocument();
});
