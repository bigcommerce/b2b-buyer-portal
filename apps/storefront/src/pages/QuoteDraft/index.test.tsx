import { PersistPartial } from 'redux-persist/es/persistReducer';
import {
  buildCompanyStateWith,
  builder,
  buildStoreInfoStateWith,
  bulk,
  faker,
  graphql,
  http,
  HttpResponse,
  renderWithProviders,
  screen,
  startMockServer,
  userEvent,
  within,
} from 'tests/test-utils';

import { QuoteInfoState } from '@/store/slices/quoteInfo';
import { CompanyStatus, CustomerRole, UserTypes } from '@/types';
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

const noAddress = buildAddressWith({
  // a missing address is modeled like this :'(
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
});

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

const customerEmail = 'info@abc.net';

const approvedB2BCompany = buildCompanyStateWith({
  companyInfo: { status: CompanyStatus.APPROVED },
  customer: {
    userType: UserTypes.MULTIPLE_B2C,
    role: CustomerRole.SENIOR_BUYER,
    emailAddress: customerEmail,
  },
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

    const quoteInfo = buildQuoteInfoStateWith({ draftQuoteInfo: { billingAddress: noAddress } });

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

    const quoteInfo = buildQuoteInfoStateWith({ draftQuoteInfo: { shippingAddress: noAddress } });

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

describe('when editing the buyer info', () => {
  it('displays the "Contact person" and "Email" fields as disabled', async () => {
    const alabama = { stateName: 'Alabama', stateCode: 'AL' };
    const usa = { id: '226', countryName: 'United States', countryCode: 'US', states: [alabama] };
    const usAddress = buildAddressWith({ country: usa.countryCode, state: alabama.stateCode });

    server.use(
      graphql.query('Countries', () => HttpResponse.json({ data: { countries: [usa] } })),
      graphql.query('Addresses', () =>
        HttpResponse.json({ data: { addresses: { totalCount: 0, edges: [] } } }),
      ),
      graphql.query('getQuoteExtraFields', () =>
        HttpResponse.json({ data: { quoteExtraFieldsConfig: [] } }),
      ),
    );

    const quoteInfo = buildQuoteInfoStateWith({
      draftQuoteInfo: {
        contactInfo: { name: 'Joey Johnson', email: 'joey.johnson@abc.com' },
        shippingAddress: usAddress,
        billingAddress: usAddress,
      },
    });

    renderWithProviders(<QuoteDraft setOpenPage={vi.fn()} />, {
      preloadedState: { ...preloadedState, quoteInfo },
    });

    await userEvent.click(screen.getByRole('button', { name: 'Edit info' }));

    expect(screen.getByRole('textbox', { name: 'Contact person' })).toBeDisabled();
    expect(screen.getByRole('textbox', { name: 'Email' })).toBeDisabled();
  });
});

describe('when buyer info is changed and then saved', () => {
  it('displays the updated buyer info details', async () => {
    const alabama = { stateName: 'Alabama', stateCode: 'AL' };
    const usa = { id: '226', countryName: 'United States', countryCode: 'US', states: [alabama] };
    const usAddress = buildAddressWith({ country: usa.countryCode, state: alabama.stateCode });

    server.use(
      graphql.query('Countries', () => HttpResponse.json({ data: { countries: [usa] } })),
      graphql.query('Addresses', () =>
        HttpResponse.json({ data: { addresses: { totalCount: 0, edges: [] } } }),
      ),
      graphql.query('getQuoteExtraFields', () =>
        HttpResponse.json({ data: { quoteExtraFieldsConfig: [] } }),
      ),
      http.post('*/api/v2/extra-fields/quote/validate', () => HttpResponse.json({ code: 200 })),
    );

    const quoteInfo = buildQuoteInfoStateWith({
      draftQuoteInfo: {
        // email is checked on save and must match the company.customer in state for the save to succeed
        contactInfo: { companyName: 'ABC Inc', phoneNumber: '04747666333', email: customerEmail },
        shippingAddress: usAddress,
        billingAddress: usAddress,
      },
    });

    renderWithProviders(<QuoteDraft setOpenPage={vi.fn()} />, {
      preloadedState: { ...preloadedState, quoteInfo },
    });

    await userEvent.click(screen.getByRole('button', { name: 'Edit info' }));

    const phoneInput = screen.getByRole('textbox', { name: 'Phone' });
    await userEvent.clear(phoneInput);
    await userEvent.type(phoneInput, '1234567890');

    const companyInput = screen.getByRole('textbox', { name: 'Company name' });
    await userEvent.clear(companyInput);
    await userEvent.type(companyInput, "Jack's Slacks");

    await userEvent.click(screen.getByRole('button', { name: 'Save info' }));

    const buyerInfo = await screen.findByRole('article', { name: 'Buyer info' });

    expect(within(buyerInfo).getByText("Jack's Slacks")).toBeInTheDocument();
    expect(within(buyerInfo).getByText('1234567890')).toBeInTheDocument();
  });
});

describe('when quote info is changed and then saved', () => {
  it('displays the updated quote info details', async () => {
    const alabama = { stateName: 'Alabama', stateCode: 'AL' };
    const usa = { id: '226', countryName: 'United States', countryCode: 'US', states: [alabama] };
    const usAddress = buildAddressWith({ country: usa.countryCode, state: alabama.stateCode });

    server.use(
      graphql.query('Countries', () => HttpResponse.json({ data: { countries: [usa] } })),
      graphql.query('Addresses', () =>
        HttpResponse.json({ data: { addresses: { totalCount: 0, edges: [] } } }),
      ),
      graphql.query('getQuoteExtraFields', () =>
        HttpResponse.json({ data: { quoteExtraFieldsConfig: [] } }),
      ),
      http.post('*/api/v2/extra-fields/quote/validate', () => HttpResponse.json({ code: 200 })),
    );

    const quoteInfo = buildQuoteInfoStateWith({
      draftQuoteInfo: {
        // email is checked on save and must match the company.customer in state for the save to succeed
        contactInfo: { email: customerEmail, quoteTitle: '' },
        referenceNumber: '',
        shippingAddress: usAddress,
        billingAddress: usAddress,
      },
    });

    renderWithProviders(<QuoteDraft setOpenPage={vi.fn()} />, {
      preloadedState: { ...preloadedState, quoteInfo },
    });

    await userEvent.click(screen.getByRole('button', { name: 'Edit info' }));

    const phoneInput = screen.getByRole('textbox', { name: 'Quote Title' });
    await userEvent.type(phoneInput, 'Lots of nice things');

    const companyInput = screen.getByRole('textbox', { name: 'Reference number' });
    await userEvent.type(companyInput, '818767');

    const ccInput = screen.getByRole('textbox', { name: 'CC email' });
    await userEvent.type(ccInput, 'fred@acme.com');

    await userEvent.click(screen.getByRole('button', { name: 'Save info' }));

    const quoteInfoSummary = await screen.findByRole('article', { name: 'Quote info' });
    expect(within(quoteInfoSummary).getByText('Title: Lots of nice things')).toBeInTheDocument();
    expect(within(quoteInfoSummary).getByText('Reference: 818767')).toBeInTheDocument();
    expect(within(quoteInfoSummary).getByText('CC: fred@acme.com')).toBeInTheDocument();
  });
});

describe('when a billing address is added and then saved', () => {
  it('displays the billing address', async () => {
    const alabama = { stateName: 'Alabama', stateCode: 'AL' };
    const usa = { id: '226', countryName: 'United States', countryCode: 'US', states: [alabama] };

    server.use(
      graphql.query('Countries', () => HttpResponse.json({ data: { countries: [usa] } })),
      graphql.query('Addresses', () =>
        HttpResponse.json({ data: { addresses: { totalCount: 0, edges: [] } } }),
      ),
      graphql.query('getQuoteExtraFields', () =>
        HttpResponse.json({ data: { quoteExtraFieldsConfig: [] } }),
      ),
      http.post('*/api/v2/extra-fields/quote/validate', () => HttpResponse.json({ code: 200 })),
    );

    const quoteInfo = buildQuoteInfoStateWith({
      draftQuoteInfo: {
        // email is checked on save and must match the company.customer in state for the save to succeed
        contactInfo: { email: customerEmail },
        billingAddress: noAddress,
        shippingAddress: noAddress,
      },
    });

    renderWithProviders(<QuoteDraft setOpenPage={vi.fn()} />, {
      preloadedState: { ...preloadedState, quoteInfo },
    });

    await userEvent.click(screen.getByRole('button', { name: 'Edit info' }));

    const shippingFields = screen.getByRole('group', { name: 'Billing' });

    await userEvent.type(
      within(shippingFields).getByRole('textbox', { name: 'Address label' }),
      'ABC Inc',
    );
    await userEvent.type(
      within(shippingFields).getByRole('textbox', { name: 'First name' }),
      'Joey',
    );
    await userEvent.type(
      within(shippingFields).getByRole('textbox', { name: 'Last name' }),
      'Johnson',
    );
    await userEvent.type(
      within(shippingFields).getByRole('textbox', { name: 'Company' }),
      'ABC Inc',
    );
    await userEvent.click(within(shippingFields).getByRole('combobox', { name: 'Country' }));
    await userEvent.click(screen.getByRole('option', { name: 'United States' }));
    await userEvent.type(
      within(shippingFields).getByRole('textbox', { name: 'Address line 1' }),
      '1 Main St',
    );
    await userEvent.type(
      within(shippingFields).getByRole('textbox', { name: 'Address line 2 (optional)' }),
      'Apt 4B',
    );
    await userEvent.type(
      within(shippingFields).getByRole('textbox', { name: 'City' }),
      'Springfield',
    );
    await userEvent.click(within(shippingFields).getByRole('combobox', { name: 'State' }));
    await userEvent.click(screen.getByRole('option', { name: 'Alabama' }));
    await userEvent.type(
      within(shippingFields).getByRole('textbox', { name: 'Zip code' }),
      '62701',
    );
    await userEvent.type(
      within(shippingFields).getByRole('textbox', { name: 'Phone number' }),
      '04747666333',
    );

    await userEvent.click(screen.getByRole('button', { name: 'Save info' }));

    const billingSummary = await screen.findByRole('article', { name: 'Billing' });

    expect(within(billingSummary).getByText('ABC Inc')).toBeInTheDocument();
    expect(within(billingSummary).getByText('Joey Johnson')).toBeInTheDocument();
    expect(within(billingSummary).getByText('1 Main St')).toBeInTheDocument();
    expect(within(billingSummary).getByText('Apt 4B')).toBeInTheDocument();
    expect(within(billingSummary).getByText('Springfield, Alabama, 62701, US')).toBeInTheDocument();
    expect(within(billingSummary).getByText('04747666333')).toBeInTheDocument();
  });
});

describe('when a shipping address is added and then saved', () => {
  it('displays the shipping address', async () => {
    const alabama = { stateName: 'Alabama', stateCode: 'AL' };
    const usa = { id: '226', countryName: 'United States', countryCode: 'US', states: [alabama] };

    server.use(
      graphql.query('Countries', () => HttpResponse.json({ data: { countries: [usa] } })),
      graphql.query('Addresses', () =>
        HttpResponse.json({ data: { addresses: { totalCount: 0, edges: [] } } }),
      ),
      graphql.query('getQuoteExtraFields', () =>
        HttpResponse.json({ data: { quoteExtraFieldsConfig: [] } }),
      ),
      http.post('*/api/v2/extra-fields/quote/validate', () => HttpResponse.json({ code: 200 })),
    );

    const quoteInfo = buildQuoteInfoStateWith({
      draftQuoteInfo: {
        // email is checked on save and must match the company.customer in state for the save to succeed
        contactInfo: { email: customerEmail },
        billingAddress: noAddress,
        shippingAddress: noAddress,
      },
    });

    renderWithProviders(<QuoteDraft setOpenPage={vi.fn()} />, {
      preloadedState: { ...preloadedState, quoteInfo },
    });

    await userEvent.click(screen.getByRole('button', { name: 'Edit info' }));

    const shippingFields = screen.getByRole('group', { name: 'Shipping' });

    await userEvent.type(
      within(shippingFields).getByRole('textbox', { name: 'Address label' }),
      'My home',
    );
    await userEvent.type(
      within(shippingFields).getByRole('textbox', { name: 'First name' }),
      'Sam',
    );
    await userEvent.type(
      within(shippingFields).getByRole('textbox', { name: 'Last name' }),
      'Jackson',
    );
    await userEvent.click(within(shippingFields).getByRole('combobox', { name: 'Country' }));
    await userEvent.click(screen.getByRole('option', { name: 'United States' }));
    await userEvent.type(
      within(shippingFields).getByRole('textbox', { name: 'Address line 1' }),
      '2 Small Street',
    );
    await userEvent.type(
      within(shippingFields).getByRole('textbox', { name: 'Address line 2 (optional)' }),
      'South Nelson',
    );
    await userEvent.type(within(shippingFields).getByRole('textbox', { name: 'City' }), 'Big Town');
    await userEvent.click(within(shippingFields).getByRole('combobox', { name: 'State' }));
    await userEvent.click(screen.getByRole('option', { name: 'Alabama' }));
    await userEvent.type(
      within(shippingFields).getByRole('textbox', { name: 'Zip code' }),
      '62799',
    );
    await userEvent.type(
      within(shippingFields).getByRole('textbox', { name: 'Phone number' }),
      '04747613123',
    );

    await userEvent.click(screen.getByRole('button', { name: 'Save info' }));

    const shippingSummary = await screen.findByRole('article', { name: 'Shipping' });

    expect(within(shippingSummary).getByText('My home')).toBeInTheDocument();
    expect(within(shippingSummary).getByText('Sam Jackson')).toBeInTheDocument();
    expect(within(shippingSummary).getByText('2 Small Street')).toBeInTheDocument();
    expect(within(shippingSummary).getByText('South Nelson')).toBeInTheDocument();
    expect(within(shippingSummary).getByText('Big Town, Alabama, 62799, US')).toBeInTheDocument();
    expect(within(shippingSummary).getByText('04747613123')).toBeInTheDocument();
  });
});
