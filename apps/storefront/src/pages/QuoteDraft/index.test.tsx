import { set } from 'lodash-es';
import { PersistPartial } from 'redux-persist/es/persistReducer';
import {
  buildCompanyStateWith,
  builder,
  buildGlobalStateWith,
  buildQuoteWith,
  buildStoreInfoStateWith,
  bulk,
  faker,
  graphql,
  http,
  HttpResponse,
  renderWithProviders,
  screen,
  startMockServer,
  stringContainingAll,
  userEvent,
  waitForElementToBeRemoved,
  within,
} from 'tests/test-utils';
import { when } from 'vitest-when';

import { PriceProductsResponse } from '@/shared/service/b2b/graphql/global';
import {
  SearchProductsResponse,
  ValidateProductResponse,
} from '@/shared/service/b2b/graphql/product';
import { QuoteInfoState } from '@/store/slices/quoteInfo';
import { CompanyStatus, CustomerRole, UserTypes } from '@/types';
import { CreateQuoteResponse, QuoteInfo, QuoteItem } from '@/types/quotes';

import QuoteDraft from '.';

interface VariantInfoResponse {
  data: {
    variantSku: VariantInfo[];
  };
}

interface VariantInfo {
  isStock: '1' | '0';
  stock: number;
  calculatedPrice: string;
  productId: string;
  variantId: string;
  baseSku: string;
  productName: string;
  categories: string[];
  option: unknown[];
  isVisible: '1' | '0';
  minQuantity: number;
  maxQuantity: number;
  modifiers: unknown[];
  purchasingDisabled: '1' | '0';
  variantSku: string;
  imageUrl: string;
}

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
  availableToSell: faker.number.int(),
  unlimitedBackorder: faker.datatype.boolean(),
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

const buildVariantOptionsWith = builder(() => ({
  id: faker.number.int(),
  label: faker.commerce.productAdjective(),
  option_id: faker.number.int(),
  option_display_name: faker.commerce.productMaterial(),
}));

const buildVariantWith = builder<
  SearchProductsResponse['data']['productsSearch'][number]['variants'][number]
>(() => ({
  variant_id: faker.number.int({ min: 1, max: 10000 }),
  product_id: faker.number.int(),
  sku: faker.string.uuid(),
  option_values: bulk(buildVariantOptionsWith, 'WHATEVER_VALUES').times(
    faker.number.int({ min: 0, max: 10 }),
  ),
  calculated_price: Number(faker.commerce.price()),
  image_url: faker.image.url(),
  has_price_list: faker.datatype.boolean(),
  bulk_prices: [],
  purchasing_disabled: faker.datatype.boolean(),
  cost_price: Number(faker.commerce.price()),
  inventory_level: faker.number.int(),
  available_to_sell: faker.number.int(),
  unlimited_backorder: faker.datatype.boolean(),
  bc_calculated_price: {
    as_entered: Number(faker.commerce.price()),
    tax_inclusive: Number(faker.commerce.price()),
    tax_exclusive: Number(faker.commerce.price()),
    entered_inclusive: faker.datatype.boolean(),
  },
}));

type SearchProduct = SearchProductsResponse['data']['productsSearch'][number];
type SearchProductV3Option = SearchProduct['optionsV3'][number];
type SearchProductV3OptionValue = SearchProductV3Option['option_values'][number];

type ValidateProduct = ValidateProductResponse['data']['validateProduct'];

const buildPrice = builder(() => ({
  asEntered: Number(faker.commerce.price()),
  enteredInclusive: faker.datatype.boolean(),
  taxExclusive: Number(faker.commerce.price()),
  taxInclusive: Number(faker.commerce.price()),
}));

const buildProductPriceWith = builder(() => ({
  productId: faker.number.int(),
  variantId: faker.number.int(),
  options: [],
  referenceRequest: {
    productId: faker.number.int(),
    variantId: faker.number.int(),
    options: null,
  },
  retailPrice: null,
  salePrice: null,
  minimumAdvertisedPrice: null,
  saved: null,
  price: buildPrice('WHATEVER_VALUES'),
  calculatedPrice: buildPrice('WHATEVER_VALUES'),
  priceRange: {
    minimum: buildPrice('WHATEVER_VALUES'),
    maximum: buildPrice('WHATEVER_VALUES'),
  },
  retailPriceRange: null,
  bulkPricing: [],
}));

const buildSearchProductOptionsWith = builder(() => ({
  option_id: faker.number.int(),
  display_name: faker.commerce.productMaterial(),
  sort_order: faker.number.int(),
  is_required: faker.datatype.boolean(),
}));

const buildSearchProductV3OptionValueWith = builder<SearchProductV3OptionValue>(() => ({
  id: faker.number.int(),
  label: faker.commerce.productAdjective(),
  sort_order: faker.number.int(),
  value_data: null,
  is_default: faker.datatype.boolean(),
}));

const buildSearchProductV3OptionWith = builder<SearchProductV3Option>(() => ({
  id: faker.number.int(),
  product_id: faker.number.int(),
  name: faker.commerce.productMaterial(),
  display_name: faker.commerce.productMaterial(),
  type: faker.helpers.arrayElement(['rectangles', 'swatch']),
  sort_order: faker.number.int(),
  option_values: bulk(buildSearchProductV3OptionValueWith, 'WHATEVER_VALUES').times(
    faker.number.int({ min: 0, max: 10 }),
  ),
  config: [],
}));

const buildSearchProductWith = builder<SearchProduct>(() => ({
  id: faker.number.int(),
  name: faker.commerce.productName(),
  sku: faker.string.uuid(),
  costPrice: faker.commerce.price(),
  inventoryLevel: faker.number.int(),
  inventoryTracking: faker.helpers.arrayElement(['none', 'simple', 'variant']),
  availability: faker.helpers.arrayElement(['available', 'unavailable']),
  orderQuantityMinimum: faker.number.int(),
  orderQuantityMaximum: faker.number.int(),
  variants: bulk(buildVariantWith, 'WHATEVER_VALUES').times(faker.number.int({ min: 0, max: 10 })),
  currencyCode: faker.finance.currencyCode(),
  imageUrl: faker.image.url(),
  modifiers: [],
  options: bulk(buildSearchProductOptionsWith, 'WHATEVER_VALUES').times(
    faker.number.int({ min: 0, max: 10 }),
  ),
  optionsV3: bulk(buildSearchProductV3OptionWith, 'WHATEVER_VALUES').times(
    faker.number.int({ min: 0, max: 10 }),
  ),
  channelId: [],
  productUrl: faker.internet.url(),
  taxClassId: faker.number.int(),
  isPriceHidden: faker.datatype.boolean(),
  availableToSell: faker.number.int(),
  unlimitedBackorder: faker.datatype.boolean(),
}));

const buildVariantInfoWith = builder<VariantInfo>(() => ({
  isStock: faker.helpers.arrayElement(['0', '1']),
  stock: faker.number.int(),
  calculatedPrice: faker.commerce.price(),
  productId: faker.number.int().toString(),
  variantId: faker.number.int().toString(),
  baseSku: faker.string.uuid(),
  productName: faker.commerce.productName(),
  categories: Array.from({ length: faker.number.int({ min: 0, max: 3 }) }, () =>
    faker.number.int().toString(),
  ),
  imageUrl: faker.image.url(),
  option: [],
  isVisible: faker.helpers.arrayElement(['0', '1']),
  minQuantity: faker.number.int(),
  maxQuantity: faker.number.int(),
  modifiers: [],
  purchasingDisabled: faker.helpers.arrayElement(['0', '1']),
  variantSku: faker.string.uuid(),
}));

const buildVariantInfoResponseWith = builder<VariantInfoResponse>(() => ({
  data: {
    variantSku: bulk(buildVariantInfoWith, 'WHATEVER_VALUES').times(
      faker.number.int({ min: 1, max: 5 }),
    ),
  },
}));

const buildValidateProductWith = builder<ValidateProduct>(() => ({
  responseType: faker.helpers.arrayElement(['ERROR', 'WARNING', 'SUCCESS']),
  message: faker.lorem.sentence(),
}));

const buildCSVProductWith = builder(() => ({
  id: faker.string.uuid(),
  products: {
    baseSku: faker.string.uuid(),
    calculatedPrice: faker.number.int(),
    categories: [],
    imageUrl: faker.image.url(),
    isStock: '1',
    isVisible: '1',
    maxQuantity: 0,
    minQuantity: 0,
    modifiers: [],
    option: [],
    productId: faker.number.int().toString(),
    productName: faker.commerce.productName(),
    purchasingDisabled: false,
    stock: 0,
    variantId: faker.number.int(),
    variantSku: faker.string.uuid(),
  },
  sku: faker.string.uuid(),
  qty: faker.number.int({ min: 1, max: 10 }).toString(),
  row: faker.number.int(),
}));

const buildCSVUploadWith = builder(() => ({
  result: {
    errorFile: '',
    errorProduct: [],
    validProduct: bulk(buildCSVProductWith, 'WHATEVER_VALUES').times(
      faker.number.int({ min: 1, max: 5 }),
    ),
    stockErrorFile: '',
    stockErrorSkus: [],
  },
}));

const buildQuoteCreateResponseWith = builder<CreateQuoteResponse>(() => ({
  data: {
    quoteCreate: { quote: { id: faker.number.int(), createdAt: faker.date.anytime().toString() } },
  },
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

it('displays buyer information for users with not addresses permission', async () => {
  server.use(
    graphql.query('Countries', () => HttpResponse.json({ data: { countries: [] } })),
    graphql.query('Addresses', () =>
      HttpResponse.json({
        errors: [
          {
            message: 'Permission denied.',
            locations: [{ line: 2, column: 3 }],
            path: ['addresses'],
          },
        ],
        data: { addresses: null },
      }),
    ),
    graphql.query('getQuoteExtraFields', () =>
      HttpResponse.json({ data: { quoteExtraFieldsConfig: [] } }),
    ),
  );

  const customRoleCompany = buildCompanyStateWith({
    companyInfo: { status: CompanyStatus.APPROVED },
    customer: {
      userType: UserTypes.MULTIPLE_B2C,
      role: CustomerRole.CUSTOM_ROLE,
    },
  });

  const quoteInfo = buildQuoteInfoStateWith({
    draftQuoteInfo: {
      contactInfo: {
        name: 'Custom User',
        email: 'custom.user@example.com',
        companyName: 'Custom Role Company',
        phoneNumber: '555-0123',
      },
    },
  });

  renderWithProviders(<QuoteDraft setOpenPage={vi.fn()} />, {
    preloadedState: {
      company: customRoleCompany,
      storeInfo: storeInfoWithDateFormat,
      quoteInfo,
    },
  });

  const buyerInfo = await screen.findByRole('article', { name: 'Buyer info' });

  expect(within(buyerInfo).getByText('Custom User')).toBeInTheDocument();
  expect(within(buyerInfo).getByText('custom.user@example.com')).toBeInTheDocument();
  expect(within(buyerInfo).getByText('Custom Role Company')).toBeInTheDocument();
  expect(within(buyerInfo).getByText('555-0123')).toBeInTheDocument();
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

it('displays the quote info', async () => {
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

describe('when the user is a B2B customer', () => {
  it('shows the results in a modal and allows adding to quote', async () => {
    const alabama = { stateName: 'Alabama', stateCode: 'AL' };
    const usa = { id: '226', countryName: 'United States', countryCode: 'US', states: [alabama] };

    const searchProducts = vi.fn<(...arg: unknown[]) => SearchProductsResponse>();

    const variant = buildVariantWith({
      purchasing_disabled: false,
      bc_calculated_price: {
        tax_exclusive: 123,
      },
    });

    when(searchProducts)
      .calledWith(stringContainingAll('search: "Laugh Canister"', 'currencyCode: "USD"'))
      .thenReturn({
        data: {
          productsSearch: [
            buildSearchProductWith({
              id: variant.product_id,
              name: 'Laugh Canister',
              sku: 'LC-123',
              optionsV3: [],
              isPriceHidden: false,
              orderQuantityMinimum: 0,
              orderQuantityMaximum: 0,
              inventoryLevel: 100,
              variants: [variant],
            }),
          ],
        },
      });

    const getPriceProducts = vi.fn<(...arg: unknown[]) => PriceProductsResponse>();

    when(getPriceProducts)
      .calledWith({
        storeHash: 'store-hash',
        channelId: 1,
        currencyCode: 'USD',
        items: [{ productId: variant.product_id, variantId: variant.variant_id, options: [] }],
        customerGroupId: 0,
      })
      .thenReturn({
        data: {
          priceProducts: [buildProductPriceWith('WHATEVER_VALUES')],
        },
      });

    server.use(
      graphql.query('Countries', () => HttpResponse.json({ data: { countries: [usa] } })),
      graphql.query('Addresses', () =>
        HttpResponse.json({ data: { addresses: { totalCount: 0, edges: [] } } }),
      ),
      graphql.query('getQuoteExtraFields', () =>
        HttpResponse.json({ data: { quoteExtraFieldsConfig: [] } }),
      ),
      graphql.query('SearchProducts', ({ query }) => HttpResponse.json(searchProducts(query))),
      graphql.query('priceProducts', ({ variables }) =>
        HttpResponse.json(getPriceProducts(variables)),
      ),
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

    await userEvent.click(screen.getByText('Add to quote'));
    const searchProduct = screen.getByPlaceholderText('Search products');
    await userEvent.type(searchProduct, 'Laugh Canister');
    await userEvent.click(screen.getByRole('button', { name: 'Search product' }));
    const dialog = await screen.findByRole('dialog');

    const addToQuote = within(dialog).getByRole('button', { name: 'Add to quote' });

    await userEvent.click(addToQuote);

    expect(await screen.findByText('Product was added to your quote.')).toBeInTheDocument();
  });

  it('add product by sku to draft quote', async () => {
    const alabama = { stateName: 'Alabama', stateCode: 'AL' };
    const usa = { id: '226', countryName: 'United States', countryCode: 'US', states: [alabama] };

    const searchProducts = vi.fn<(...arg: unknown[]) => SearchProductsResponse>();

    const variant = buildVariantWith({
      purchasing_disabled: false,
      bc_calculated_price: {
        tax_exclusive: 123,
      },
    });

    when(searchProducts)
      .calledWith(expect.stringContaining(`productIds: [${variant.product_id}]`))
      .thenReturn({
        data: {
          productsSearch: [
            buildSearchProductWith({
              id: variant.product_id,
              name: 'Laugh Canister',
              sku: 'LC-123',
              optionsV3: [],
              isPriceHidden: false,
              orderQuantityMinimum: 0,
              orderQuantityMaximum: 0,
              inventoryLevel: 100,
              variants: [variant],
            }),
          ],
        },
      });

    const getPriceProducts = vi.fn<(...arg: unknown[]) => PriceProductsResponse>();

    when(getPriceProducts)
      .calledWith({
        storeHash: 'store-hash',
        channelId: 1,
        currencyCode: 'USD',
        items: [{ productId: variant.product_id, variantId: variant.variant_id, options: [] }],
        customerGroupId: 0,
      })
      .thenReturn({
        data: {
          priceProducts: [buildProductPriceWith('WHATEVER_VALUES')],
        },
      });

    const getVariantInfoBySkus = vi.fn();

    const variantInfo = buildVariantInfoWith({
      variantSku: 'LC-123',
      minQuantity: 0,
      purchasingDisabled: '0',
      isStock: '1',
      stock: 50,
      productId: variant.product_id.toString(),
      variantId: variant.variant_id.toString(),
    });

    when(getVariantInfoBySkus)
      .calledWith(expect.stringContaining('variantSkus: ["LC-123"]'))
      .thenDo(() => buildVariantInfoResponseWith({ data: { variantSku: [variantInfo] } }));

    server.use(
      graphql.query('Countries', () => HttpResponse.json({ data: { countries: [usa] } })),
      graphql.query('Addresses', () =>
        HttpResponse.json({ data: { addresses: { totalCount: 0, edges: [] } } }),
      ),
      graphql.query('getQuoteExtraFields', () =>
        HttpResponse.json({ data: { quoteExtraFieldsConfig: [] } }),
      ),
      graphql.query('SearchProducts', ({ query }) => HttpResponse.json(searchProducts(query))),
      graphql.query('priceProducts', ({ variables }) =>
        HttpResponse.json(getPriceProducts(variables)),
      ),
      graphql.query('GetVariantInfoBySkus', ({ query }) =>
        HttpResponse.json(getVariantInfoBySkus(query)),
      ),
    );

    const quoteInfo = buildQuoteInfoStateWith({
      draftQuoteInfo: {
        contactInfo: { email: customerEmail },
        billingAddress: noAddress,
        shippingAddress: noAddress,
      },
    });

    renderWithProviders(<QuoteDraft setOpenPage={vi.fn()} />, {
      preloadedState: { ...preloadedState, quoteInfo },
    });

    await userEvent.click(screen.getByText('Add to quote'));
    const quickAddProduct = screen.getByLabelText('SKU#');
    await userEvent.type(quickAddProduct, 'LC-123');
    const quantityProduct = screen.getByLabelText('Qty');
    await userEvent.type(quantityProduct, '1');
    await userEvent.click(screen.getByRole('button', { name: 'Add products to Quote' }));

    expect(await screen.findByText('Products were added to your quote.')).toBeInTheDocument();
  });

  it('shows stock warning in the product table', async () => {
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
    );

    const product = buildDraftQuoteItemWith({
      node: {
        quantity: 100,
        variantSku: 'LC-123',
        productsSearch: buildProductWith({
          inventoryLevel: 10,
          inventoryTracking: 'product',
          variants: [
            buildVariantWith({ inventory_level: 10, purchasing_disabled: false, sku: 'LC-123' }),
          ],
        }),
      },
    });

    const quoteInfo = buildQuoteInfoStateWith({
      draftQuoteInfo: {
        // email is checked on save and must match the company.customer in state for the save to succeed
        contactInfo: { email: customerEmail },
        billingAddress: noAddress,
        shippingAddress: noAddress,
      },
      draftQuoteList: [product],
    });

    renderWithProviders(<QuoteDraft setOpenPage={vi.fn()} />, {
      preloadedState: {
        ...preloadedState,
        quoteInfo,
        global: buildGlobalStateWith({
          blockPendingQuoteNonPurchasableOOS: { isEnableProduct: false },
        }),
      },
    });

    const productTable = await screen.findByRole('table');

    expect(within(productTable).getByText('Insufficient stock')).toBeInTheDocument();
  });

  describe('when the backordering feature flag is enabled', () => {
    const featureFlags = {
      'B2B-3318.move_stock_and_backorder_validation_to_backend': true,
    };

    it('does not show stock warning in the product table', async () => {
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
      );

      const product = buildDraftQuoteItemWith({
        node: {
          quantity: 100,
          variantSku: 'LC-123',
          productsSearch: buildProductWith({
            inventoryLevel: 10,
            inventoryTracking: 'product',
            variants: [
              buildVariantWith({ inventory_level: 10, purchasing_disabled: false, sku: 'LC-123' }),
            ],
          }),
        },
      });

      const quoteInfo = buildQuoteInfoStateWith({
        draftQuoteInfo: {
          // email is checked on save and must match the company.customer in state for the save to succeed
          contactInfo: { email: customerEmail },
          billingAddress: noAddress,
          shippingAddress: noAddress,
        },
        draftQuoteList: [product],
      });

      renderWithProviders(<QuoteDraft setOpenPage={vi.fn()} />, {
        preloadedState: {
          ...preloadedState,
          quoteInfo,
          global: buildGlobalStateWith({
            blockPendingQuoteNonPurchasableOOS: { isEnableProduct: false },
            featureFlags,
          }),
        },
      });

      const productTable = await screen.findByRole('table');

      expect(within(productTable).queryByText('Insufficient stock')).not.toBeInTheDocument();
    });

    it('shows TBD as price when available to sell is insufficient', async () => {
      const product = buildDraftQuoteItemWith({
        node: {
          quantity: 10,
          variantSku: 'LC-123',
          productsSearch: buildProductWith({
            availability: 'available',
            inventoryLevel: 0,
            availableToSell: 5,
            unlimitedBackorder: false,
            inventoryTracking: 'product',
            variants: [
              buildVariantWith({
                purchasing_disabled: false,
                sku: 'LC-123',
              }),
            ],
          }),
        },
      });

      const quoteInfo = buildQuoteInfoStateWith({
        draftQuoteInfo: {
          contactInfo: { email: customerEmail },
          billingAddress: noAddress,
          shippingAddress: noAddress,
        },
        draftQuoteList: [product],
      });

      renderWithProviders(<QuoteDraft setOpenPage={vi.fn()} />, {
        preloadedState: {
          ...preloadedState,
          quoteInfo,
          global: buildGlobalStateWith({
            blockPendingQuoteNonPurchasableOOS: { isEnableProduct: true },
            featureFlags,
          }),
        },
      });

      const productTable = await screen.findByRole('table');

      expect(within(productTable).getAllByText('TBD')).toHaveLength(2);
    });

    it('does not show TBD as price when unlimited backorder is true', async () => {
      const product = buildDraftQuoteItemWith({
        node: {
          quantity: 10,
          variantSku: 'LC-123',
          productsSearch: buildProductWith({
            availability: 'available',
            inventoryLevel: 0,
            availableToSell: 5,
            unlimitedBackorder: true,
            inventoryTracking: 'product',
            variants: [
              buildVariantWith({
                purchasing_disabled: false,
                sku: 'LC-123',
              }),
            ],
          }),
        },
      });

      const quoteInfo = buildQuoteInfoStateWith({
        draftQuoteInfo: {
          contactInfo: { email: customerEmail },
          billingAddress: noAddress,
          shippingAddress: noAddress,
        },
        draftQuoteList: [product],
      });

      renderWithProviders(<QuoteDraft setOpenPage={vi.fn()} />, {
        preloadedState: {
          ...preloadedState,
          quoteInfo,
          global: buildGlobalStateWith({
            blockPendingQuoteNonPurchasableOOS: { isEnableProduct: true },
            featureFlags,
          }),
        },
      });

      const productTable = await screen.findByRole('table');

      expect(within(productTable).queryAllByText('TBD')).toHaveLength(0);
    });

    it('shows TBD as price for variant tracking when variant available to sell is insufficient', async () => {
      const product = buildDraftQuoteItemWith({
        node: {
          quantity: 10,
          variantSku: 'LC-123',
          productsSearch: buildProductWith({
            availability: 'available',
            inventoryTracking: 'variant',
            variants: [
              buildVariantWith({
                inventory_level: 0,
                available_to_sell: 5,
                unlimited_backorder: false,
                purchasing_disabled: false,
                sku: 'LC-123',
              }),
            ],
          }),
        },
      });

      const quoteInfo = buildQuoteInfoStateWith({
        draftQuoteInfo: {
          contactInfo: { email: customerEmail },
          billingAddress: noAddress,
          shippingAddress: noAddress,
        },
        draftQuoteList: [product],
      });

      renderWithProviders(<QuoteDraft setOpenPage={vi.fn()} />, {
        preloadedState: {
          ...preloadedState,
          quoteInfo,
          global: buildGlobalStateWith({
            blockPendingQuoteNonPurchasableOOS: { isEnableProduct: true },
            featureFlags,
          }),
        },
      });

      const productTable = await screen.findByRole('table');

      expect(within(productTable).getAllByText('TBD')).toHaveLength(2);
    });

    it('does not show TBD as price for variant tracking when variant has unlimited backorder', async () => {
      const product = buildDraftQuoteItemWith({
        node: {
          quantity: 10,
          variantSku: 'LC-123',
          productsSearch: buildProductWith({
            availability: 'available',
            inventoryTracking: 'variant',
            variants: [
              buildVariantWith({
                inventory_level: 0,
                available_to_sell: 5,
                unlimited_backorder: true,
                purchasing_disabled: false,
                sku: 'LC-123',
              }),
            ],
          }),
        },
      });

      const quoteInfo = buildQuoteInfoStateWith({
        draftQuoteInfo: {
          contactInfo: { email: customerEmail },
          billingAddress: noAddress,
          shippingAddress: noAddress,
        },
        draftQuoteList: [product],
      });

      renderWithProviders(<QuoteDraft setOpenPage={vi.fn()} />, {
        preloadedState: {
          ...preloadedState,
          quoteInfo,
          global: buildGlobalStateWith({
            blockPendingQuoteNonPurchasableOOS: { isEnableProduct: true },
            featureFlags,
          }),
        },
      });

      const productTable = await screen.findByRole('table');

      expect(within(productTable).queryAllByText('TBD')).toHaveLength(0);
    });

    it('does not show TBD as price when available to sell is sufficient', async () => {
      const product = buildDraftQuoteItemWith({
        node: {
          quantity: 5,
          variantSku: 'LC-123',
          productsSearch: buildProductWith({
            availability: 'available',
            inventoryLevel: 0,
            availableToSell: 10,
            unlimitedBackorder: false,
            inventoryTracking: 'product',
            variants: [
              buildVariantWith({
                purchasing_disabled: false,
                sku: 'LC-123',
              }),
            ],
          }),
        },
      });

      const quoteInfo = buildQuoteInfoStateWith({
        draftQuoteInfo: {
          contactInfo: { email: customerEmail },
          billingAddress: noAddress,
          shippingAddress: noAddress,
        },
        draftQuoteList: [product],
      });

      renderWithProviders(<QuoteDraft setOpenPage={vi.fn()} />, {
        preloadedState: {
          ...preloadedState,
          quoteInfo,
          global: buildGlobalStateWith({
            blockPendingQuoteNonPurchasableOOS: { isEnableProduct: true },
            featureFlags,
          }),
        },
      });

      const productTable = await screen.findByRole('table');

      expect(within(productTable).queryAllByText('TBD')).toHaveLength(0);
    });

    it('does not show TBD as price for variant tracking when variant available to sell is sufficient', async () => {
      const product = buildDraftQuoteItemWith({
        node: {
          quantity: 5,
          variantSku: 'LC-123',
          productsSearch: buildProductWith({
            availability: 'available',
            inventoryTracking: 'variant',
            variants: [
              buildVariantWith({
                inventory_level: 0,
                available_to_sell: 10,
                unlimited_backorder: false,
                purchasing_disabled: false,
                sku: 'LC-123',
              }),
            ],
          }),
        },
      });

      const quoteInfo = buildQuoteInfoStateWith({
        draftQuoteInfo: {
          contactInfo: { email: customerEmail },
          billingAddress: noAddress,
          shippingAddress: noAddress,
        },
        draftQuoteList: [product],
      });

      renderWithProviders(<QuoteDraft setOpenPage={vi.fn()} />, {
        preloadedState: {
          ...preloadedState,
          quoteInfo,
          global: buildGlobalStateWith({
            blockPendingQuoteNonPurchasableOOS: { isEnableProduct: true },
            featureFlags,
          }),
        },
      });

      const productTable = await screen.findByRole('table');

      expect(within(productTable).queryAllByText('TBD')).toHaveLength(0);
    });

    it('creates successfully a new quote when submitting the draft quote and gets redirected to quote detail', async () => {
      set(window, 'b2b.callbacks.dispatchEvent', vi.fn().mockReturnValue(true));
      const deleteCart = vi
        .fn()
        .mockReturnValue({ data: { cart: { deleteCart: { deletedCartEntityId: '12345' } } } });
      const quote = buildQuoteWith({ data: { quote: { id: '272989', quoteNumber: '911911' } } });

      const state = { stateName: 'Jalisco', stateCode: 'JL' };
      const country = { id: '123', countryName: 'Mexico', countryCode: 'MX', states: [state] };

      server.use(
        graphql.query('Countries', () => HttpResponse.json({ data: { countries: [country] } })),
        graphql.query('Addresses', () =>
          HttpResponse.json({ data: { addresses: { totalCount: 0, edges: [] } } }),
        ),
        graphql.query('getQuoteExtraFields', () =>
          HttpResponse.json({ data: { quoteExtraFieldsConfig: [] } }),
        ),
      );

      const companyInfo = buildCompanyStateWith({
        companyInfo: { status: CompanyStatus.APPROVED },
        customer: {
          userType: UserTypes.MULTIPLE_B2C,
          role: CustomerRole.SENIOR_BUYER,
          emailAddress: customerEmail,
        },
        permissions: [
          {
            code: 'create_quote',
            permissionLevel: 2,
          },
        ],
      });

      const preloadedState = { company: companyInfo, storeInfo: storeInfoWithDateFormat };

      const product = buildDraftQuoteItemWith({
        node: {
          primaryImage: 'url',
          quantity: 100,
          variantSku: 'test',
          basePrice: 10,
          taxPrice: 5,
          productName: 'Unbranded Rubber Cheese',
          productsSearch: buildProductWith({
            inventoryLevel: 10,
            inventoryTracking: 'product',
            sku: 'test',
            basePrice: '10.00',
            offeredPrice: '10.00',
            productId: 1,
            imageUrl: 'url',
            id: 4451490883947128,
          }),
        },
      });

      const quoteInfo = buildQuoteInfoStateWith({
        draftQuoteInfo: {
          contactInfo: { email: customerEmail },
          billingAddress: noAddress,
          shippingAddress: noAddress,
          referenceNumber: '123',
          note: 'meow',
        },
        draftQuoteList: [product],
      });

      const { navigation } = renderWithProviders(<QuoteDraft setOpenPage={vi.fn()} />, {
        preloadedState: {
          ...preloadedState,
          quoteInfo,
          global: buildGlobalStateWith({
            blockPendingQuoteNonPurchasableOOS: { isEnableProduct: false },
            featureFlags: {
              'B2B-3318.move_stock_and_backorder_validation_to_backend': true,
            },
            quoteSubmissionResponse: {
              value: '0',
            },
          }),
        },
      });

      server.use(
        graphql.mutation('CreateQuote', () =>
          HttpResponse.json(
            buildQuoteCreateResponseWith({
              data: {
                quoteCreate: { quote: { id: 123, createdAt: '1245' } },
              },
            }),
          ),
        ),
        graphql.mutation('DeleteCart', ({ variables }) => HttpResponse.json(deleteCart(variables))),
        graphql.query('GetQuoteInfoB2B', () => HttpResponse.json(quote)),
        graphql.query('SearchProducts', () => HttpResponse.json({ data: { productsSearch: [] } })),
      );

      await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

      await userEvent.click(await screen.findByRole('button', { name: /Submit/i }));

      expect(window.b2b.callbacks.dispatchEvent).toHaveBeenCalledWith('on-quote-create', {
        channelId: 1,
        companyId: 0,
        storeHash: 'store-hash',
        userEmail: customerEmail,
        subtotal: '1000.00',
        contactInfo: quoteInfo.draftQuoteInfo.contactInfo,
        taxTotal: '500.00',
        productList: [
          {
            basePrice: '10.00',
            offeredPrice: '10.00',
            discount: '0.00',
            imageUrl: 'url',
            itemId: expect.stringMatching(/\w{8}-\w{4}-\w{4}-\w{4}-\w{12}/),
            options: [],
            productId: 4451490883947128,
            productName: 'Unbranded Rubber Cheese',
            quantity: 100,
            sku: 'test',
            variantId: undefined,
          },
        ],
        quoteTitle: '',
        recipients: [],
        discount: '0.00',
        extraFields: [],
        fileList: [],
        legalTerms: '',
        shippingAddress: noAddress,
        billingAddress: noAddress,
        referenceNumber: '123',
        currency: {
          currencyCode: 'USD',
          currencyExchangeRate: '1.0000000000',
          decimalPlaces: 2,
          decimalToken: '.',
          location: 'left',
          thousandsToken: ',',
          token: '$',
        },
        message: 'meow',
        grandTotal: '1000.00',
        totalAmount: '1500.00',
      });

      expect(navigation).toHaveBeenCalled();
      expect(navigation).toHaveBeenCalledWith('/quoteDetail/123?date=1245');
    });

    it('renders snackbar error if mutation throws product validation erros', async () => {
      set(window, 'b2b.callbacks.dispatchEvent', vi.fn().mockReturnValue(true));
      const getVariantInfoOOSAndPurchase = vi.fn();

      const state = { stateName: 'Jalisco', stateCode: 'JL' };
      const country = { id: '123', countryName: 'Mexico', countryCode: 'MX', states: [state] };

      server.use(
        graphql.query('Countries', () => HttpResponse.json({ data: { countries: [country] } })),
        graphql.query('Addresses', () =>
          HttpResponse.json({ data: { addresses: { totalCount: 0, edges: [] } } }),
        ),
        graphql.query('getQuoteExtraFields', () =>
          HttpResponse.json({ data: { quoteExtraFieldsConfig: [] } }),
        ),
      );

      const companyInfo = buildCompanyStateWith({
        companyInfo: { status: CompanyStatus.APPROVED },
        customer: {
          userType: UserTypes.MULTIPLE_B2C,
          role: CustomerRole.SENIOR_BUYER,
          emailAddress: customerEmail,
        },
        permissions: [
          {
            code: 'create_quote',
            permissionLevel: 2,
          },
        ],
      });

      const preloadedState = { company: companyInfo, storeInfo: storeInfoWithDateFormat };

      const product = buildDraftQuoteItemWith({
        node: {
          primaryImage: 'url',
          quantity: 100,
          variantSku: 'test',
          basePrice: 10,
          taxPrice: 5,
          productName: 'Unbranded Rubber Cheese',
          productsSearch: buildProductWith({
            inventoryLevel: 10,
            inventoryTracking: 'product',
            sku: 'test',
            basePrice: '10.00',
            offeredPrice: '10.00',
            productId: 1,
            imageUrl: 'url',
            id: 4451490883947128,
          }),
        },
      });

      const quoteInfo = buildQuoteInfoStateWith({
        draftQuoteInfo: {
          contactInfo: { email: customerEmail },
          billingAddress: noAddress,
          shippingAddress: noAddress,
          referenceNumber: '123',
          note: 'meow',
        },
        draftQuoteList: [product],
      });

      const { navigation } = renderWithProviders(<QuoteDraft setOpenPage={vi.fn()} />, {
        preloadedState: {
          ...preloadedState,
          quoteInfo,
          global: buildGlobalStateWith({
            blockPendingQuoteNonPurchasableOOS: { isEnableProduct: false },
            featureFlags: {
              'B2B-3318.move_stock_and_backorder_validation_to_backend': true,
            },
            quoteSubmissionResponse: {
              value: '0',
            },
          }),
        },
      });

      server.use(
        graphql.mutation('CreateQuote', () =>
          HttpResponse.json(
            {
              errors: [
                {
                  path: ['quoteCreate'],
                  extensions: {
                    productValidationErrors: [
                      {
                        itemId: '1abc070d-8c4c-4f0d-9d8a-162843c10333',
                        productId: 112,
                        variantId: 77,
                        responseType: 'ERROR',
                        code: 'OOS',
                        productName: 'out of stock prod',
                      },
                    ],
                  },
                },
              ],
            },
            { status: 400 },
          ),
        ),
      );

      await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

      navigation.mockClear();

      await userEvent.click(await screen.findByRole('button', { name: /Submit/i }));

      expect(window.b2b.callbacks.dispatchEvent).toHaveBeenCalledWith('on-quote-create', {
        channelId: 1,
        companyId: 0,
        storeHash: 'store-hash',
        userEmail: customerEmail,
        subtotal: '1000.00',
        contactInfo: quoteInfo.draftQuoteInfo.contactInfo,
        taxTotal: '500.00',
        productList: [
          {
            basePrice: '10.00',
            offeredPrice: '10.00',
            discount: '0.00',
            imageUrl: 'url',
            itemId: expect.stringMatching(/\w{8}-\w{4}-\w{4}-\w{4}-\w{12}/),
            options: [],
            productId: 4451490883947128,
            productName: 'Unbranded Rubber Cheese',
            quantity: 100,
            sku: 'test',
            variantId: undefined,
          },
        ],
        quoteTitle: '',
        recipients: [],
        discount: '0.00',
        extraFields: [],
        fileList: [],
        legalTerms: '',
        shippingAddress: noAddress,
        billingAddress: noAddress,
        referenceNumber: '123',
        currency: {
          currencyCode: 'USD',
          currencyExchangeRate: '1.0000000000',
          decimalPlaces: 2,
          decimalToken: '.',
          location: 'left',
          thousandsToken: ',',
          token: '$',
        },
        message: 'meow',
        grandTotal: '1000.00',
        totalAmount: '1500.00',
      });

      expect(getVariantInfoOOSAndPurchase).not.toHaveBeenCalled();

      expect(
        await screen.findByText(
          'Product 112 is out of stock or unavailable for purchase. Please remove the product or modify the quantity of the product',
        ),
      ).toBeInTheDocument();

      expect(navigation).not.toHaveBeenCalled();
    });

    describe('product search modal', () => {
      it('adds product successfully when validateProduct returns a success', async () => {
        const alabama = { stateName: 'Alabama', stateCode: 'AL' };
        const usa = {
          id: '226',
          countryName: 'United States',
          countryCode: 'US',
          states: [alabama],
        };

        const searchProducts = vi.fn<(...arg: unknown[]) => SearchProductsResponse>();

        const variant = buildVariantWith({
          purchasing_disabled: false,
          bc_calculated_price: {
            tax_exclusive: 123,
          },
        });

        when(searchProducts)
          .calledWith(stringContainingAll('search: "Laugh Canister"', 'currencyCode: "USD"'))
          .thenReturn({
            data: {
              productsSearch: [
                buildSearchProductWith({
                  id: variant.product_id,
                  name: 'Laugh Canister',
                  sku: 'LC-123',
                  optionsV3: [],
                  isPriceHidden: false,
                  orderQuantityMinimum: 0,
                  orderQuantityMaximum: 0,
                  inventoryLevel: 100,
                  variants: [variant],
                }),
              ],
            },
          });

        const getPriceProducts = vi.fn<(...arg: unknown[]) => PriceProductsResponse>();

        when(getPriceProducts)
          .calledWith({
            storeHash: 'store-hash',
            channelId: 1,
            currencyCode: 'USD',
            items: [{ productId: variant.product_id, variantId: variant.variant_id, options: [] }],
            customerGroupId: 0,
          })
          .thenReturn({
            data: {
              priceProducts: [buildProductPriceWith('WHATEVER_VALUES')],
            },
          });

        const validateProduct = vi.fn<(...arg: unknown[]) => ValidateProductResponse>();

        when(validateProduct)
          .calledWith(
            expect.objectContaining({
              productId: variant.product_id,
              variantId: variant.variant_id,
              quantity: 1,
              productOptions: [],
            }),
          )
          .thenReturn({
            data: {
              validateProduct: buildValidateProductWith({ responseType: 'SUCCESS', message: '' }),
            },
          });

        server.use(
          graphql.query('Countries', () => HttpResponse.json({ data: { countries: [usa] } })),
          graphql.query('Addresses', () =>
            HttpResponse.json({ data: { addresses: { totalCount: 0, edges: [] } } }),
          ),
          graphql.query('getQuoteExtraFields', () =>
            HttpResponse.json({ data: { quoteExtraFieldsConfig: [] } }),
          ),
          graphql.query('SearchProducts', ({ query }) => HttpResponse.json(searchProducts(query))),
          graphql.query('priceProducts', ({ variables }) =>
            HttpResponse.json(getPriceProducts(variables)),
          ),
          graphql.query('ValidateProduct', ({ variables }) =>
            HttpResponse.json(validateProduct(variables)),
          ),
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
          preloadedState: {
            ...preloadedState,
            quoteInfo,
            global: buildGlobalStateWith({
              blockPendingQuoteNonPurchasableOOS: { isEnableProduct: false },
              featureFlags,
            }),
          },
        });

        await userEvent.click(screen.getByText('Add to quote'));
        const searchProduct = screen.getByPlaceholderText('Search products');
        await userEvent.type(searchProduct, 'Laugh Canister');
        await userEvent.click(screen.getByRole('button', { name: 'Search product' }));
        const dialog = await screen.findByRole('dialog');

        const addToQuote = within(dialog).getByRole('button', { name: 'Add to quote' });

        await userEvent.click(addToQuote);

        expect(validateProduct).toHaveBeenCalled();
        expect(await screen.findByText('Product was added to your quote.')).toBeInTheDocument();
      });

      it('adds product successfully when validateProduct returns a warning', async () => {
        const alabama = { stateName: 'Alabama', stateCode: 'AL' };
        const usa = {
          id: '226',
          countryName: 'United States',
          countryCode: 'US',
          states: [alabama],
        };

        const searchProducts = vi.fn<(...arg: unknown[]) => SearchProductsResponse>();

        const variant = buildVariantWith({
          purchasing_disabled: false,
          bc_calculated_price: {
            tax_exclusive: 123,
          },
        });

        when(searchProducts)
          .calledWith(stringContainingAll('search: "Laugh Canister"', 'currencyCode: "USD"'))
          .thenReturn({
            data: {
              productsSearch: [
                buildSearchProductWith({
                  id: variant.product_id,
                  name: 'Laugh Canister',
                  sku: 'LC-123',
                  optionsV3: [],
                  isPriceHidden: false,
                  orderQuantityMinimum: 0,
                  orderQuantityMaximum: 0,
                  inventoryLevel: 100,
                  variants: [variant],
                }),
              ],
            },
          });

        const getPriceProducts = vi.fn<(...arg: unknown[]) => PriceProductsResponse>();

        when(getPriceProducts)
          .calledWith({
            storeHash: 'store-hash',
            channelId: 1,
            currencyCode: 'USD',
            items: [{ productId: variant.product_id, variantId: variant.variant_id, options: [] }],
            customerGroupId: 0,
          })
          .thenReturn({
            data: {
              priceProducts: [buildProductPriceWith('WHATEVER_VALUES')],
            },
          });

        const validateProduct = vi.fn<(...arg: unknown[]) => ValidateProductResponse>();

        when(validateProduct)
          .calledWith(
            expect.objectContaining({
              productId: variant.product_id,
              variantId: variant.variant_id,
              quantity: 1,
              productOptions: [],
            }),
          )
          .thenReturn({
            data: {
              validateProduct: buildValidateProductWith({
                responseType: 'WARNING',
                message: 'validation warning',
              }),
            },
          });

        server.use(
          graphql.query('Countries', () => HttpResponse.json({ data: { countries: [usa] } })),
          graphql.query('Addresses', () =>
            HttpResponse.json({ data: { addresses: { totalCount: 0, edges: [] } } }),
          ),
          graphql.query('getQuoteExtraFields', () =>
            HttpResponse.json({ data: { quoteExtraFieldsConfig: [] } }),
          ),
          graphql.query('SearchProducts', ({ query }) => HttpResponse.json(searchProducts(query))),
          graphql.query('priceProducts', ({ variables }) =>
            HttpResponse.json(getPriceProducts(variables)),
          ),
          graphql.query('ValidateProduct', ({ variables }) =>
            HttpResponse.json(validateProduct(variables)),
          ),
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
          preloadedState: {
            ...preloadedState,
            quoteInfo,
            global: buildGlobalStateWith({
              blockPendingQuoteNonPurchasableOOS: { isEnableProduct: false },
              featureFlags,
            }),
          },
        });

        await userEvent.click(screen.getByText('Add to quote'));
        const searchProduct = screen.getByPlaceholderText('Search products');
        await userEvent.type(searchProduct, 'Laugh Canister');
        await userEvent.click(screen.getByRole('button', { name: 'Search product' }));
        const dialog = await screen.findByRole('dialog');

        const addToQuote = within(dialog).getByRole('button', { name: 'Add to quote' });

        await userEvent.click(addToQuote);

        expect(validateProduct).toHaveBeenCalled();
        expect(await screen.findByText('Product was added to your quote.')).toBeInTheDocument();
      });

      it('does not add product when validateProduct returns an error', async () => {
        const alabama = { stateName: 'Alabama', stateCode: 'AL' };
        const usa = {
          id: '226',
          countryName: 'United States',
          countryCode: 'US',
          states: [alabama],
        };

        const searchProducts = vi.fn<(...arg: unknown[]) => SearchProductsResponse>();

        const variant = buildVariantWith({
          purchasing_disabled: false,
          bc_calculated_price: {
            tax_exclusive: 123,
          },
        });

        when(searchProducts)
          .calledWith(stringContainingAll('search: "Laugh Canister"', 'currencyCode: "USD"'))
          .thenReturn({
            data: {
              productsSearch: [
                buildSearchProductWith({
                  id: variant.product_id,
                  name: 'Laugh Canister',
                  sku: 'LC-123',
                  optionsV3: [],
                  isPriceHidden: false,
                  orderQuantityMinimum: 0,
                  orderQuantityMaximum: 0,
                  inventoryLevel: 100,
                  variants: [variant],
                }),
              ],
            },
          });

        const getPriceProducts = vi.fn<(...arg: unknown[]) => PriceProductsResponse>();

        when(getPriceProducts)
          .calledWith({
            storeHash: 'store-hash',
            channelId: 1,
            currencyCode: 'USD',
            items: [{ productId: variant.product_id, variantId: variant.variant_id, options: [] }],
            customerGroupId: 0,
          })
          .thenReturn({
            data: {
              priceProducts: [buildProductPriceWith('WHATEVER_VALUES')],
            },
          });

        const validateProduct = vi.fn<(...arg: unknown[]) => ValidateProductResponse>();

        when(validateProduct)
          .calledWith(
            expect.objectContaining({
              productId: variant.product_id,
              variantId: variant.variant_id,
              quantity: 1,
              productOptions: [],
            }),
          )
          .thenReturn({
            data: {
              validateProduct: buildValidateProductWith({
                responseType: 'ERROR',
                message: 'validation error',
              }),
            },
          });

        server.use(
          graphql.query('Countries', () => HttpResponse.json({ data: { countries: [usa] } })),
          graphql.query('Addresses', () =>
            HttpResponse.json({ data: { addresses: { totalCount: 0, edges: [] } } }),
          ),
          graphql.query('getQuoteExtraFields', () =>
            HttpResponse.json({ data: { quoteExtraFieldsConfig: [] } }),
          ),
          graphql.query('SearchProducts', ({ query }) => HttpResponse.json(searchProducts(query))),
          graphql.query('priceProducts', ({ variables }) =>
            HttpResponse.json(getPriceProducts(variables)),
          ),
          graphql.query('ValidateProduct', ({ variables }) =>
            HttpResponse.json(validateProduct(variables)),
          ),
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
          preloadedState: {
            ...preloadedState,
            quoteInfo,
            global: buildGlobalStateWith({
              blockPendingQuoteNonPurchasableOOS: { isEnableProduct: false },
              featureFlags,
            }),
          },
        });

        await userEvent.click(screen.getByText('Add to quote'));
        const searchProduct = screen.getByPlaceholderText('Search products');
        await userEvent.type(searchProduct, 'Laugh Canister');
        await userEvent.click(screen.getByRole('button', { name: 'Search product' }));
        const dialog = await screen.findByRole('dialog');

        const addToQuote = within(dialog).getByRole('button', { name: 'Add to quote' });

        await userEvent.click(addToQuote);

        expect(validateProduct).toHaveBeenCalled();
        expect(await screen.findByText('validation error')).toBeInTheDocument();
        expect(screen.queryByText('Product was added to your quote.')).not.toBeInTheDocument();
      });

      it('adds product successfully and does not call validateProduct when NP&OOS setting is enabled', async () => {
        const searchProducts = vi.fn<(...arg: unknown[]) => SearchProductsResponse>();

        const variant = buildVariantWith({
          purchasing_disabled: false,
          bc_calculated_price: {
            tax_exclusive: 123,
          },
        });

        when(searchProducts)
          .calledWith(stringContainingAll('search: "Laugh Canister"', 'currencyCode: "USD"'))
          .thenReturn({
            data: {
              productsSearch: [
                buildSearchProductWith({
                  id: variant.product_id,
                  name: 'Laugh Canister',
                  sku: 'LC-123',
                  optionsV3: [],
                  isPriceHidden: false,
                  orderQuantityMinimum: 0,
                  orderQuantityMaximum: 0,
                  inventoryLevel: 100,
                  variants: [variant],
                }),
              ],
            },
          });

        const getPriceProducts = vi.fn<(...arg: unknown[]) => PriceProductsResponse>();

        when(getPriceProducts)
          .calledWith({
            storeHash: 'store-hash',
            channelId: 1,
            currencyCode: 'USD',
            items: [{ productId: variant.product_id, variantId: variant.variant_id, options: [] }],
            customerGroupId: 0,
          })
          .thenReturn({
            data: {
              priceProducts: [buildProductPriceWith('WHATEVER_VALUES')],
            },
          });

        const validateProduct = vi.fn<(...arg: unknown[]) => ValidateProductResponse>();

        when(validateProduct)
          .calledWith(
            expect.objectContaining({
              productId: variant.product_id,
              variantId: variant.variant_id,
              quantity: 1,
              productOptions: [],
            }),
          )
          .thenReturn({
            data: {
              validateProduct: buildValidateProductWith({ responseType: 'SUCCESS', message: '' }),
            },
          });

        server.use(
          graphql.query('SearchProducts', ({ query }) => HttpResponse.json(searchProducts(query))),
          graphql.query('priceProducts', ({ variables }) =>
            HttpResponse.json(getPriceProducts(variables)),
          ),
          graphql.query('ValidateProduct', ({ variables }) =>
            HttpResponse.json(validateProduct(variables)),
          ),
        );

        const quoteInfo = buildQuoteInfoStateWith({
          draftQuoteInfo: {
            contactInfo: { email: customerEmail },
            billingAddress: noAddress,
            shippingAddress: noAddress,
          },
        });

        renderWithProviders(<QuoteDraft setOpenPage={vi.fn()} />, {
          preloadedState: {
            ...preloadedState,
            quoteInfo,
            global: buildGlobalStateWith({
              blockPendingQuoteNonPurchasableOOS: { isEnableProduct: true },
              featureFlags,
            }),
          },
        });

        await userEvent.click(screen.getByText('Add to quote'));
        const searchProduct = screen.getByPlaceholderText('Search products');
        await userEvent.type(searchProduct, 'Laugh Canister');
        await userEvent.click(screen.getByRole('button', { name: 'Search product' }));
        const dialog = await screen.findByRole('dialog');

        const addToQuote = within(dialog).getByRole('button', { name: 'Add to quote' });

        await userEvent.click(addToQuote);

        expect(validateProduct).not.toHaveBeenCalled();
        expect(await screen.findByText('Product was added to your quote.')).toBeInTheDocument();
      });
    });

    describe('quick add', () => {
      it('adds product successfully when validateProduct returns a success', async () => {
        const alabama = { stateName: 'Alabama', stateCode: 'AL' };
        const usa = {
          id: '226',
          countryName: 'United States',
          countryCode: 'US',
          states: [alabama],
        };

        const searchProducts = vi.fn<(...arg: unknown[]) => SearchProductsResponse>();

        const variant = buildVariantWith({
          purchasing_disabled: false,
          bc_calculated_price: {
            tax_exclusive: 123,
          },
        });

        when(searchProducts)
          .calledWith(expect.stringContaining(`productIds: [${variant.product_id}]`))
          .thenReturn({
            data: {
              productsSearch: [
                buildSearchProductWith({
                  id: variant.product_id,
                  name: 'Laugh Canister',
                  sku: 'LC-123',
                  optionsV3: [],
                  isPriceHidden: false,
                  orderQuantityMinimum: 0,
                  orderQuantityMaximum: 0,
                  inventoryLevel: 100,
                  variants: [variant],
                }),
              ],
            },
          });

        const getPriceProducts = vi.fn<(...arg: unknown[]) => PriceProductsResponse>();

        when(getPriceProducts)
          .calledWith({
            storeHash: 'store-hash',
            channelId: 1,
            currencyCode: 'USD',
            items: [{ productId: variant.product_id, variantId: variant.variant_id, options: [] }],
            customerGroupId: 0,
          })
          .thenReturn({
            data: {
              priceProducts: [buildProductPriceWith('WHATEVER_VALUES')],
            },
          });

        const getVariantInfoBySkus = vi.fn();

        const variantInfo = buildVariantInfoWith({
          variantSku: 'LC-123',
          minQuantity: 0,
          purchasingDisabled: '0',
          isStock: '1',
          stock: 50,
          productId: variant.product_id.toString(),
          variantId: variant.variant_id.toString(),
        });

        when(getVariantInfoBySkus)
          .calledWith(expect.stringContaining('variantSkus: ["LC-123"]'))
          .thenDo(() => buildVariantInfoResponseWith({ data: { variantSku: [variantInfo] } }));

        const validateProduct = vi.fn<(...arg: unknown[]) => ValidateProductResponse>();

        when(validateProduct)
          .calledWith(
            expect.objectContaining({
              productId: variant.product_id,
              variantId: variant.variant_id,
              quantity: 1,
              productOptions: [],
            }),
          )
          .thenReturn({
            data: {
              validateProduct: buildValidateProductWith({
                responseType: 'SUCCESS',
                message: '',
              }),
            },
          });

        server.use(
          graphql.query('Countries', () => HttpResponse.json({ data: { countries: [usa] } })),
          graphql.query('Addresses', () =>
            HttpResponse.json({ data: { addresses: { totalCount: 0, edges: [] } } }),
          ),
          graphql.query('getQuoteExtraFields', () =>
            HttpResponse.json({ data: { quoteExtraFieldsConfig: [] } }),
          ),
          graphql.query('SearchProducts', ({ query }) => HttpResponse.json(searchProducts(query))),
          graphql.query('priceProducts', ({ variables }) =>
            HttpResponse.json(getPriceProducts(variables)),
          ),
          graphql.query('GetVariantInfoBySkus', ({ query }) =>
            HttpResponse.json(getVariantInfoBySkus(query)),
          ),
          graphql.query('ValidateProduct', ({ variables }) =>
            HttpResponse.json(validateProduct(variables)),
          ),
        );

        const quoteInfo = buildQuoteInfoStateWith({
          draftQuoteInfo: {
            contactInfo: { email: customerEmail },
            billingAddress: noAddress,
            shippingAddress: noAddress,
          },
        });

        renderWithProviders(<QuoteDraft setOpenPage={vi.fn()} />, {
          preloadedState: {
            ...preloadedState,
            quoteInfo,
            global: buildGlobalStateWith({
              blockPendingQuoteNonPurchasableOOS: { isEnableProduct: false },
              featureFlags,
            }),
          },
        });

        await userEvent.click(screen.getByText('Add to quote'));
        const quickAddProduct = screen.getByLabelText('SKU#');
        await userEvent.type(quickAddProduct, 'LC-123');
        const quantityProduct = screen.getByLabelText('Qty');
        await userEvent.type(quantityProduct, '1');
        await userEvent.click(screen.getByRole('button', { name: 'Add products to Quote' }));

        expect(validateProduct).toHaveBeenCalled();
        expect(await screen.findByText('Products were added to your quote.')).toBeInTheDocument();
      });

      it('adds product successfully when validateProduct returns a warning', async () => {
        const alabama = { stateName: 'Alabama', stateCode: 'AL' };
        const usa = {
          id: '226',
          countryName: 'United States',
          countryCode: 'US',
          states: [alabama],
        };

        const searchProducts = vi.fn<(...arg: unknown[]) => SearchProductsResponse>();

        const variant = buildVariantWith({
          purchasing_disabled: false,
          bc_calculated_price: {
            tax_exclusive: 123,
          },
        });

        when(searchProducts)
          .calledWith(expect.stringContaining(`productIds: [${variant.product_id}]`))
          .thenReturn({
            data: {
              productsSearch: [
                buildSearchProductWith({
                  id: variant.product_id,
                  name: 'Laugh Canister',
                  sku: 'LC-123',
                  optionsV3: [],
                  isPriceHidden: false,
                  orderQuantityMinimum: 0,
                  orderQuantityMaximum: 0,
                  inventoryLevel: 100,
                  variants: [variant],
                }),
              ],
            },
          });

        const getPriceProducts = vi.fn<(...arg: unknown[]) => PriceProductsResponse>();

        when(getPriceProducts)
          .calledWith({
            storeHash: 'store-hash',
            channelId: 1,
            currencyCode: 'USD',
            items: [{ productId: variant.product_id, variantId: variant.variant_id, options: [] }],
            customerGroupId: 0,
          })
          .thenReturn({
            data: {
              priceProducts: [buildProductPriceWith('WHATEVER_VALUES')],
            },
          });

        const getVariantInfoBySkus = vi.fn();

        const variantInfo = buildVariantInfoWith({
          variantSku: 'LC-123',
          minQuantity: 0,
          purchasingDisabled: '0',
          isStock: '1',
          stock: 50,
          productId: variant.product_id.toString(),
          variantId: variant.variant_id.toString(),
        });

        when(getVariantInfoBySkus)
          .calledWith(expect.stringContaining('variantSkus: ["LC-123"]'))
          .thenDo(() => buildVariantInfoResponseWith({ data: { variantSku: [variantInfo] } }));

        const validateProduct = vi.fn<(...arg: unknown[]) => ValidateProductResponse>();

        when(validateProduct)
          .calledWith(
            expect.objectContaining({
              productId: variant.product_id,
              variantId: variant.variant_id,
              quantity: 1,
              productOptions: [],
            }),
          )
          .thenReturn({
            data: {
              validateProduct: buildValidateProductWith({
                responseType: 'WARNING',
                message: 'validation warning',
              }),
            },
          });

        server.use(
          graphql.query('Countries', () => HttpResponse.json({ data: { countries: [usa] } })),
          graphql.query('Addresses', () =>
            HttpResponse.json({ data: { addresses: { totalCount: 0, edges: [] } } }),
          ),
          graphql.query('getQuoteExtraFields', () =>
            HttpResponse.json({ data: { quoteExtraFieldsConfig: [] } }),
          ),
          graphql.query('SearchProducts', ({ query }) => HttpResponse.json(searchProducts(query))),
          graphql.query('priceProducts', ({ variables }) =>
            HttpResponse.json(getPriceProducts(variables)),
          ),
          graphql.query('GetVariantInfoBySkus', ({ query }) =>
            HttpResponse.json(getVariantInfoBySkus(query)),
          ),
          graphql.query('ValidateProduct', ({ variables }) =>
            HttpResponse.json(validateProduct(variables)),
          ),
        );

        const quoteInfo = buildQuoteInfoStateWith({
          draftQuoteInfo: {
            contactInfo: { email: customerEmail },
            billingAddress: noAddress,
            shippingAddress: noAddress,
          },
        });

        renderWithProviders(<QuoteDraft setOpenPage={vi.fn()} />, {
          preloadedState: {
            ...preloadedState,
            quoteInfo,
            global: buildGlobalStateWith({
              blockPendingQuoteNonPurchasableOOS: { isEnableProduct: false },
              featureFlags,
            }),
          },
        });

        await userEvent.click(screen.getByText('Add to quote'));
        const quickAddProduct = screen.getByLabelText('SKU#');
        await userEvent.type(quickAddProduct, 'LC-123');
        const quantityProduct = screen.getByLabelText('Qty');
        await userEvent.type(quantityProduct, '1');
        await userEvent.click(screen.getByRole('button', { name: 'Add products to Quote' }));

        expect(validateProduct).toHaveBeenCalled();
        expect(await screen.findByText('Products were added to your quote.')).toBeInTheDocument();
      });

      it('does not add product when validateProduct returns an error', async () => {
        const alabama = { stateName: 'Alabama', stateCode: 'AL' };
        const usa = {
          id: '226',
          countryName: 'United States',
          countryCode: 'US',
          states: [alabama],
        };

        const searchProducts = vi.fn<(...arg: unknown[]) => SearchProductsResponse>();

        const variant = buildVariantWith({
          purchasing_disabled: false,
          bc_calculated_price: {
            tax_exclusive: 123,
          },
        });

        when(searchProducts)
          .calledWith(expect.stringContaining(`productIds: [${variant.product_id}]`))
          .thenReturn({
            data: {
              productsSearch: [
                buildSearchProductWith({
                  id: variant.product_id,
                  name: 'Laugh Canister',
                  sku: 'LC-123',
                  optionsV3: [],
                  isPriceHidden: false,
                  orderQuantityMinimum: 0,
                  orderQuantityMaximum: 0,
                  inventoryLevel: 100,
                  variants: [variant],
                }),
              ],
            },
          });

        const getPriceProducts = vi.fn<(...arg: unknown[]) => PriceProductsResponse>();

        when(getPriceProducts)
          .calledWith({
            storeHash: 'store-hash',
            channelId: 1,
            currencyCode: 'USD',
            items: [{ productId: variant.product_id, variantId: variant.variant_id, options: [] }],
            customerGroupId: 0,
          })
          .thenReturn({
            data: {
              priceProducts: [buildProductPriceWith('WHATEVER_VALUES')],
            },
          });

        const getVariantInfoBySkus = vi.fn();

        const variantInfo = buildVariantInfoWith({
          variantSku: 'LC-123',
          minQuantity: 0,
          purchasingDisabled: '0',
          isStock: '1',
          stock: 50,
          productId: variant.product_id.toString(),
          variantId: variant.variant_id.toString(),
        });

        when(getVariantInfoBySkus)
          .calledWith(expect.stringContaining('variantSkus: ["LC-123"]'))
          .thenDo(() => buildVariantInfoResponseWith({ data: { variantSku: [variantInfo] } }));

        const validateProduct = vi.fn<(...arg: unknown[]) => ValidateProductResponse>();

        when(validateProduct)
          .calledWith(
            expect.objectContaining({
              productId: variant.product_id,
              variantId: variant.variant_id,
              quantity: 1,
              productOptions: [],
            }),
          )
          .thenReturn({
            data: {
              validateProduct: buildValidateProductWith({
                responseType: 'ERROR',
                message: 'validation error',
              }),
            },
          });

        server.use(
          graphql.query('Countries', () => HttpResponse.json({ data: { countries: [usa] } })),
          graphql.query('Addresses', () =>
            HttpResponse.json({ data: { addresses: { totalCount: 0, edges: [] } } }),
          ),
          graphql.query('getQuoteExtraFields', () =>
            HttpResponse.json({ data: { quoteExtraFieldsConfig: [] } }),
          ),
          graphql.query('SearchProducts', ({ query }) => HttpResponse.json(searchProducts(query))),
          graphql.query('priceProducts', ({ variables }) =>
            HttpResponse.json(getPriceProducts(variables)),
          ),
          graphql.query('GetVariantInfoBySkus', ({ query }) =>
            HttpResponse.json(getVariantInfoBySkus(query)),
          ),
          graphql.query('ValidateProduct', ({ variables }) =>
            HttpResponse.json(validateProduct(variables)),
          ),
        );

        const quoteInfo = buildQuoteInfoStateWith({
          draftQuoteInfo: {
            contactInfo: { email: customerEmail },
            billingAddress: noAddress,
            shippingAddress: noAddress,
          },
        });

        renderWithProviders(<QuoteDraft setOpenPage={vi.fn()} />, {
          preloadedState: {
            ...preloadedState,
            quoteInfo,
            global: buildGlobalStateWith({
              blockPendingQuoteNonPurchasableOOS: { isEnableProduct: false },
              featureFlags,
            }),
          },
        });

        await userEvent.click(screen.getByText('Add to quote'));
        const quickAddProduct = screen.getByLabelText('SKU#');
        await userEvent.type(quickAddProduct, 'LC-123');
        const quantityProduct = screen.getByLabelText('Qty');
        await userEvent.type(quantityProduct, '1');
        await userEvent.click(screen.getByRole('button', { name: 'Add products to Quote' }));

        expect(validateProduct).toHaveBeenCalled();
        expect(await screen.findByText('validation error')).toBeInTheDocument();
        expect(screen.queryByText('Products were added to your quote.')).not.toBeInTheDocument();
      });

      it('adds product successfully and does not call validateProduct when NP&OOS setting is enabled', async () => {
        const searchProducts = vi.fn<(...arg: unknown[]) => SearchProductsResponse>();

        const variant = buildVariantWith({
          purchasing_disabled: false,
          bc_calculated_price: {
            tax_exclusive: 123,
          },
        });

        when(searchProducts)
          .calledWith(expect.stringContaining(`productIds: [${variant.product_id}]`))
          .thenReturn({
            data: {
              productsSearch: [
                buildSearchProductWith({
                  id: variant.product_id,
                  name: 'Laugh Canister',
                  sku: 'LC-123',
                  optionsV3: [],
                  isPriceHidden: false,
                  orderQuantityMinimum: 0,
                  orderQuantityMaximum: 0,
                  inventoryLevel: 100,
                  variants: [variant],
                }),
              ],
            },
          });

        const getPriceProducts = vi.fn<(...arg: unknown[]) => PriceProductsResponse>();

        when(getPriceProducts)
          .calledWith({
            storeHash: 'store-hash',
            channelId: 1,
            currencyCode: 'USD',
            items: [{ productId: variant.product_id, variantId: variant.variant_id, options: [] }],
            customerGroupId: 0,
          })
          .thenReturn({
            data: {
              priceProducts: [buildProductPriceWith('WHATEVER_VALUES')],
            },
          });

        const getVariantInfoBySkus = vi.fn();

        const variantInfo = buildVariantInfoWith({
          variantSku: 'LC-123',
          minQuantity: 0,
          purchasingDisabled: '0',
          isStock: '1',
          stock: 50,
          productId: variant.product_id.toString(),
          variantId: variant.variant_id.toString(),
        });

        when(getVariantInfoBySkus)
          .calledWith(expect.stringContaining('variantSkus: ["LC-123"]'))
          .thenDo(() => buildVariantInfoResponseWith({ data: { variantSku: [variantInfo] } }));

        const validateProduct = vi.fn<(...arg: unknown[]) => ValidateProductResponse>();

        when(validateProduct)
          .calledWith(
            expect.objectContaining({
              productId: variant.product_id,
              variantId: variant.variant_id,
              quantity: 1,
              productOptions: [],
            }),
          )
          .thenReturn({
            data: {
              validateProduct: buildValidateProductWith({
                responseType: 'SUCCESS',
                message: '',
              }),
            },
          });

        server.use(
          graphql.query('SearchProducts', ({ query }) => HttpResponse.json(searchProducts(query))),
          graphql.query('priceProducts', ({ variables }) =>
            HttpResponse.json(getPriceProducts(variables)),
          ),
          graphql.query('GetVariantInfoBySkus', ({ query }) =>
            HttpResponse.json(getVariantInfoBySkus(query)),
          ),
          graphql.query('ValidateProduct', ({ variables }) =>
            HttpResponse.json(validateProduct(variables)),
          ),
        );

        const quoteInfo = buildQuoteInfoStateWith({
          draftQuoteInfo: {
            contactInfo: { email: customerEmail },
            billingAddress: noAddress,
            shippingAddress: noAddress,
          },
        });

        renderWithProviders(<QuoteDraft setOpenPage={vi.fn()} />, {
          preloadedState: {
            ...preloadedState,
            quoteInfo,
            global: buildGlobalStateWith({
              blockPendingQuoteNonPurchasableOOS: { isEnableProduct: true },
              featureFlags,
            }),
          },
        });

        await userEvent.click(screen.getByText('Add to quote'));
        const quickAddProduct = screen.getByLabelText('SKU#');
        await userEvent.type(quickAddProduct, 'LC-123');
        const quantityProduct = screen.getByLabelText('Qty');
        await userEvent.type(quantityProduct, '1');
        await userEvent.click(screen.getByRole('button', { name: 'Add products to Quote' }));

        expect(validateProduct).not.toHaveBeenCalled();
        expect(await screen.findByText('Products were added to your quote.')).toBeInTheDocument();
      });
    });

    describe('csv upload', () => {
      it('adds product successfully when validateProduct returns a success', async () => {
        const alabama = { stateName: 'Alabama', stateCode: 'AL' };
        const usa = {
          id: '226',
          countryName: 'United States',
          countryCode: 'US',
          states: [alabama],
        };

        const csvProducts = [
          buildCSVProductWith({
            id: '73737',
            products: {
              productId: '73737',
              variantId: 12345,
              productName: 'CSV Product 1',
              variantSku: 'CSV-001',
              baseSku: 'CSV-001',
            },
            sku: 'CSV-001',
            qty: '2',
          }),
          buildCSVProductWith({
            id: '73738',
            products: {
              productId: '73738',
              variantId: 12346,
              productName: 'CSV Product 2',
              variantSku: 'CSV-002',
              baseSku: 'CSV-002',
            },
            sku: 'CSV-002',
            qty: '3',
          }),
        ];

        const searchProducts = vi.fn<(...arg: unknown[]) => SearchProductsResponse>();

        when(searchProducts)
          .calledWith(expect.stringContaining('productIds: [73737,73738]'))
          .thenReturn({
            data: {
              productsSearch: csvProducts.map((csvProduct) =>
                buildSearchProductWith({
                  id: parseInt(csvProduct.products.productId, 10),
                  name: csvProduct.products.productName,
                  sku: csvProduct.products.variantSku,
                  optionsV3: [],
                  isPriceHidden: false,
                  orderQuantityMinimum: 0,
                  orderQuantityMaximum: 0,
                  inventoryLevel: 100,
                  variants: [
                    buildVariantWith({
                      product_id: parseInt(csvProduct.products.productId, 10),
                      sku: csvProduct.products.variantSku,
                      variant_id: csvProduct.products.variantId,
                    }),
                  ],
                }),
              ),
            },
          });

        const getPriceProducts = vi.fn<(...arg: unknown[]) => PriceProductsResponse>();

        when(getPriceProducts)
          .calledWith({
            storeHash: 'store-hash',
            channelId: 1,
            currencyCode: 'USD',
            items: csvProducts.map((csvProduct) => ({
              productId: parseInt(csvProduct.products.productId, 10),
              variantId: csvProduct.products.variantId,
              options: [],
            })),
            customerGroupId: 0,
          })
          .thenReturn({
            data: {
              priceProducts: csvProducts.map((csvProduct) =>
                buildProductPriceWith({
                  productId: parseInt(csvProduct.products.productId, 10),
                  variantId: csvProduct.products.variantId,
                  options: [],
                }),
              ),
            },
          });

        const getVariantInfoBySkus = vi.fn();

        when(getVariantInfoBySkus)
          .calledWith(expect.stringContaining('variantSkus: ["CSV-001", "CSV-002"]'))
          .thenReturn(() =>
            buildVariantInfoResponseWith({
              data: {
                variantSku: csvProducts.map((csvProduct) =>
                  buildVariantInfoWith({
                    variantSku: csvProduct.products.variantSku,
                    variantId: csvProduct.products.variantId.toString(),
                    productId: csvProduct.products.productId,
                    productName: csvProduct.products.productName,
                    minQuantity: 0,
                    purchasingDisabled: '0',
                    isStock: '1',
                    stock: 50,
                  }),
                ),
              },
            }),
          );

        const validateProduct = vi.fn<(...arg: unknown[]) => ValidateProductResponse>();

        when(validateProduct)
          .calledWith(expect.any(Object))
          .thenReturn({
            data: {
              validateProduct: buildValidateProductWith({ responseType: 'SUCCESS', message: '' }),
            },
          });

        const csvUpload = vi.fn();

        when(csvUpload)
          .calledWith(
            stringContainingAll('sku: "CSV-001"', 'qty: "2"', 'sku: "CSV-002"', 'qty: "3"'),
          )
          .thenReturn({
            data: {
              productUpload: buildCSVUploadWith({
                result: {
                  validProduct: csvProducts,
                },
              }),
            },
          });

        server.use(
          graphql.query('Countries', () => HttpResponse.json({ data: { countries: [usa] } })),
          graphql.query('Addresses', () =>
            HttpResponse.json({ data: { addresses: { totalCount: 0, edges: [] } } }),
          ),
          graphql.query('getQuoteExtraFields', () =>
            HttpResponse.json({ data: { quoteExtraFieldsConfig: [] } }),
          ),
          graphql.query('SearchProducts', ({ query }) => HttpResponse.json(searchProducts(query))),
          graphql.query('priceProducts', ({ variables }) =>
            HttpResponse.json(getPriceProducts(variables)),
          ),
          graphql.query('GetVariantInfoBySkus', ({ query }) =>
            HttpResponse.json(getVariantInfoBySkus(query)),
          ),
          graphql.query('ValidateProduct', ({ variables }) =>
            HttpResponse.json(validateProduct(variables)),
          ),
          graphql.mutation('ProductUpload', ({ query }) => {
            return HttpResponse.json(csvUpload(query));
          }),
        );

        const quoteInfo = buildQuoteInfoStateWith({
          draftQuoteInfo: {
            contactInfo: { email: customerEmail },
            billingAddress: noAddress,
            shippingAddress: noAddress,
          },
        });

        renderWithProviders(<QuoteDraft setOpenPage={vi.fn()} />, {
          preloadedState: {
            ...preloadedState,
            quoteInfo,
            global: buildGlobalStateWith({
              blockPendingQuoteNonPurchasableOOS: { isEnableProduct: false },
              featureFlags,
            }),
          },
        });

        await userEvent.click(screen.getByText('Add to quote'));

        const uploadButton = screen.getByRole('button', { name: /bulk upload csv/i });
        await userEvent.click(uploadButton);

        const dialog = await screen.findByRole('dialog', { name: /bulk upload/i });

        const csvContent = 'variant_sku,qty\nCSV-001,2\nCSV-002,3';
        const file = new File([csvContent], 'products.csv', { type: 'text/csv' });

        const dropzoneInput = dialog.querySelector<HTMLInputElement>('input[type="file"]');
        if (!dropzoneInput) {
          throw new Error('File input not found');
        }

        await userEvent.upload(dropzoneInput, [file]);

        await within(dialog).findByText('products.csv');

        const addToListButton = screen.getByRole('button', { name: /add to list/i });
        await userEvent.click(addToListButton);

        expect(validateProduct).toHaveBeenCalledTimes(2);
        expect(await screen.findByText('Products were added to your quote.')).toBeInTheDocument();
      });

      it('adds product successfully when validateProduct returns a warning', async () => {
        const alabama = { stateName: 'Alabama', stateCode: 'AL' };
        const usa = {
          id: '226',
          countryName: 'United States',
          countryCode: 'US',
          states: [alabama],
        };

        const csvProducts = [
          buildCSVProductWith({
            id: '73737',
            products: {
              productId: '73737',
              variantId: 12345,
              productName: 'CSV Product 1',
              variantSku: 'CSV-001',
              baseSku: 'CSV-001',
            },
            sku: 'CSV-001',
            qty: '2',
          }),
          buildCSVProductWith({
            id: '73738',
            products: {
              productId: '73738',
              variantId: 12346,
              productName: 'CSV Product 2',
              variantSku: 'CSV-002',
              baseSku: 'CSV-002',
            },
            sku: 'CSV-002',
            qty: '3',
          }),
        ];

        const searchProducts = vi.fn<(...arg: unknown[]) => SearchProductsResponse>();

        when(searchProducts)
          .calledWith(expect.stringContaining('productIds: [73737,73738]'))
          .thenReturn({
            data: {
              productsSearch: csvProducts.map((csvProduct) =>
                buildSearchProductWith({
                  id: parseInt(csvProduct.products.productId, 10),
                  name: csvProduct.products.productName,
                  sku: csvProduct.products.variantSku,
                  optionsV3: [],
                  isPriceHidden: false,
                  orderQuantityMinimum: 0,
                  orderQuantityMaximum: 0,
                  inventoryLevel: 100,
                  variants: [
                    buildVariantWith({
                      product_id: parseInt(csvProduct.products.productId, 10),
                      sku: csvProduct.products.variantSku,
                      variant_id: csvProduct.products.variantId,
                    }),
                  ],
                }),
              ),
            },
          });

        const getPriceProducts = vi.fn<(...arg: unknown[]) => PriceProductsResponse>();

        when(getPriceProducts)
          .calledWith({
            storeHash: 'store-hash',
            channelId: 1,
            currencyCode: 'USD',
            items: csvProducts.map((csvProduct) => ({
              productId: parseInt(csvProduct.products.productId, 10),
              variantId: csvProduct.products.variantId,
              options: [],
            })),
            customerGroupId: 0,
          })
          .thenReturn({
            data: {
              priceProducts: csvProducts.map((csvProduct) =>
                buildProductPriceWith({
                  productId: parseInt(csvProduct.products.productId, 10),
                  variantId: csvProduct.products.variantId,
                  options: [],
                }),
              ),
            },
          });

        const getVariantInfoBySkus = vi.fn();

        when(getVariantInfoBySkus)
          .calledWith(expect.stringContaining('variantSkus: ["CSV-001", "CSV-002"]'))
          .thenReturn(() =>
            buildVariantInfoResponseWith({
              data: {
                variantSku: csvProducts.map((csvProduct) =>
                  buildVariantInfoWith({
                    variantSku: csvProduct.products.variantSku,
                    variantId: csvProduct.products.variantId.toString(),
                    productId: csvProduct.products.productId,
                    productName: csvProduct.products.productName,
                    minQuantity: 0,
                    purchasingDisabled: '0',
                    isStock: '1',
                    stock: 50,
                  }),
                ),
              },
            }),
          );

        const validateProduct = vi.fn<(...arg: unknown[]) => ValidateProductResponse>();

        when(validateProduct)
          .calledWith(expect.any(Object))
          .thenReturn({
            data: {
              validateProduct: buildValidateProductWith({
                responseType: 'WARNING',
                message: 'validation warning',
              }),
            },
          });

        const csvUpload = vi.fn();

        when(csvUpload)
          .calledWith(
            stringContainingAll('sku: "CSV-001"', 'qty: "2"', 'sku: "CSV-002"', 'qty: "3"'),
          )
          .thenReturn({
            data: {
              productUpload: buildCSVUploadWith({
                result: {
                  validProduct: csvProducts,
                },
              }),
            },
          });

        server.use(
          graphql.query('Countries', () => HttpResponse.json({ data: { countries: [usa] } })),
          graphql.query('Addresses', () =>
            HttpResponse.json({ data: { addresses: { totalCount: 0, edges: [] } } }),
          ),
          graphql.query('getQuoteExtraFields', () =>
            HttpResponse.json({ data: { quoteExtraFieldsConfig: [] } }),
          ),
          graphql.query('SearchProducts', ({ query }) => HttpResponse.json(searchProducts(query))),
          graphql.query('priceProducts', ({ variables }) =>
            HttpResponse.json(getPriceProducts(variables)),
          ),
          graphql.query('GetVariantInfoBySkus', ({ query }) =>
            HttpResponse.json(getVariantInfoBySkus(query)),
          ),
          graphql.query('ValidateProduct', ({ variables }) =>
            HttpResponse.json(validateProduct(variables)),
          ),
          graphql.mutation('ProductUpload', ({ query }) => {
            return HttpResponse.json(csvUpload(query));
          }),
        );

        const quoteInfo = buildQuoteInfoStateWith({
          draftQuoteInfo: {
            contactInfo: { email: customerEmail },
            billingAddress: noAddress,
            shippingAddress: noAddress,
          },
        });

        renderWithProviders(<QuoteDraft setOpenPage={vi.fn()} />, {
          preloadedState: {
            ...preloadedState,
            quoteInfo,
            global: buildGlobalStateWith({
              blockPendingQuoteNonPurchasableOOS: { isEnableProduct: false },
              featureFlags,
            }),
          },
        });

        await userEvent.click(screen.getByText('Add to quote'));

        const uploadButton = screen.getByRole('button', { name: /bulk upload csv/i });
        await userEvent.click(uploadButton);

        const dialog = await screen.findByRole('dialog', { name: /bulk upload/i });

        const csvContent = 'variant_sku,qty\nCSV-001,2\nCSV-002,3';
        const file = new File([csvContent], 'products.csv', { type: 'text/csv' });

        const dropzoneInput = dialog.querySelector<HTMLInputElement>('input[type="file"]');
        if (!dropzoneInput) {
          throw new Error('File input not found');
        }

        await userEvent.upload(dropzoneInput, [file]);

        await within(dialog).findByText('products.csv');

        const addToListButton = screen.getByRole('button', { name: /add to list/i });
        await userEvent.click(addToListButton);

        expect(validateProduct).toHaveBeenCalledTimes(2);
        expect(await screen.findByText('Products were added to your quote.')).toBeInTheDocument();
      });

      it('does not add product when validateProduct returns an error', async () => {
        const alabama = { stateName: 'Alabama', stateCode: 'AL' };
        const usa = {
          id: '226',
          countryName: 'United States',
          countryCode: 'US',
          states: [alabama],
        };

        const csvProducts = [
          buildCSVProductWith({
            id: '73737',
            products: {
              productId: '73737',
              variantId: 12345,
              productName: 'CSV Product 1',
              variantSku: 'CSV-001',
              baseSku: 'CSV-001',
            },
            sku: 'CSV-001',
            qty: '2',
          }),
          buildCSVProductWith({
            id: '73738',
            products: {
              productId: '73738',
              variantId: 12346,
              productName: 'CSV Product 2',
              variantSku: 'CSV-002',
              baseSku: 'CSV-002',
            },
            sku: 'CSV-002',
            qty: '3',
          }),
        ];

        const searchProducts = vi.fn<(...arg: unknown[]) => SearchProductsResponse>();

        when(searchProducts)
          .calledWith(expect.stringContaining('productIds: [73737,73738]'))
          .thenReturn({
            data: {
              productsSearch: csvProducts.map((csvProduct) =>
                buildSearchProductWith({
                  id: parseInt(csvProduct.products.productId, 10),
                  name: csvProduct.products.productName,
                  sku: csvProduct.products.variantSku,
                  optionsV3: [],
                  isPriceHidden: false,
                  orderQuantityMinimum: 0,
                  orderQuantityMaximum: 0,
                  inventoryLevel: 100,
                  variants: [
                    buildVariantWith({
                      product_id: parseInt(csvProduct.products.productId, 10),
                      sku: csvProduct.products.variantSku,
                      variant_id: csvProduct.products.variantId,
                    }),
                  ],
                }),
              ),
            },
          });

        const getPriceProducts = vi.fn<(...arg: unknown[]) => PriceProductsResponse>();

        when(getPriceProducts)
          .calledWith({
            storeHash: 'store-hash',
            channelId: 1,
            currencyCode: 'USD',
            items: csvProducts.map((csvProduct) => ({
              productId: parseInt(csvProduct.products.productId, 10),
              variantId: csvProduct.products.variantId,
              options: [],
            })),
            customerGroupId: 0,
          })
          .thenReturn({
            data: {
              priceProducts: csvProducts.map((csvProduct) =>
                buildProductPriceWith({
                  productId: parseInt(csvProduct.products.productId, 10),
                  variantId: csvProduct.products.variantId,
                  options: [],
                }),
              ),
            },
          });

        const getVariantInfoBySkus = vi.fn();

        when(getVariantInfoBySkus)
          .calledWith(expect.stringContaining('variantSkus: ["CSV-001", "CSV-002"]'))
          .thenReturn(() =>
            buildVariantInfoResponseWith({
              data: {
                variantSku: csvProducts.map((csvProduct) =>
                  buildVariantInfoWith({
                    variantSku: csvProduct.products.variantSku,
                    variantId: csvProduct.products.variantId.toString(),
                    productId: csvProduct.products.productId,
                    productName: csvProduct.products.productName,
                    minQuantity: 0,
                    purchasingDisabled: '0',
                    isStock: '1',
                    stock: 50,
                  }),
                ),
              },
            }),
          );

        const validateProduct = vi.fn<(...arg: unknown[]) => ValidateProductResponse>();

        when(validateProduct)
          .calledWith(expect.any(Object))
          .thenReturn({
            data: {
              validateProduct: buildValidateProductWith({
                responseType: 'ERROR',
                message: 'validation error',
              }),
            },
          });

        const csvUpload = vi.fn();

        when(csvUpload)
          .calledWith(
            stringContainingAll('sku: "CSV-001"', 'qty: "2"', 'sku: "CSV-002"', 'qty: "3"'),
          )
          .thenReturn({
            data: {
              productUpload: buildCSVUploadWith({
                result: {
                  validProduct: csvProducts,
                },
              }),
            },
          });

        server.use(
          graphql.query('Countries', () => HttpResponse.json({ data: { countries: [usa] } })),
          graphql.query('Addresses', () =>
            HttpResponse.json({ data: { addresses: { totalCount: 0, edges: [] } } }),
          ),
          graphql.query('getQuoteExtraFields', () =>
            HttpResponse.json({ data: { quoteExtraFieldsConfig: [] } }),
          ),
          graphql.query('SearchProducts', ({ query }) => HttpResponse.json(searchProducts(query))),
          graphql.query('priceProducts', ({ variables }) =>
            HttpResponse.json(getPriceProducts(variables)),
          ),
          graphql.query('GetVariantInfoBySkus', ({ query }) =>
            HttpResponse.json(getVariantInfoBySkus(query)),
          ),
          graphql.query('ValidateProduct', ({ variables }) =>
            HttpResponse.json(validateProduct(variables)),
          ),
          graphql.mutation('ProductUpload', ({ query }) => {
            return HttpResponse.json(csvUpload(query));
          }),
        );

        const quoteInfo = buildQuoteInfoStateWith({
          draftQuoteInfo: {
            contactInfo: { email: customerEmail },
            billingAddress: noAddress,
            shippingAddress: noAddress,
          },
        });

        renderWithProviders(<QuoteDraft setOpenPage={vi.fn()} />, {
          preloadedState: {
            ...preloadedState,
            quoteInfo,
            global: buildGlobalStateWith({
              blockPendingQuoteNonPurchasableOOS: { isEnableProduct: false },
              featureFlags,
            }),
          },
        });

        await userEvent.click(screen.getByText('Add to quote'));

        const uploadButton = screen.getByRole('button', { name: /bulk upload csv/i });
        await userEvent.click(uploadButton);

        const dialog = await screen.findByRole('dialog', { name: /bulk upload/i });

        const csvContent = 'variant_sku,qty\nCSV-001,2\nCSV-002,3';
        const file = new File([csvContent], 'products.csv', { type: 'text/csv' });

        const dropzoneInput = dialog.querySelector<HTMLInputElement>('input[type="file"]');
        if (!dropzoneInput) {
          throw new Error('File input not found');
        }

        await userEvent.upload(dropzoneInput, [file]);

        await within(dialog).findByText('products.csv');

        const addToListButton = screen.getByRole('button', { name: /add to list/i });
        await userEvent.click(addToListButton);

        expect(validateProduct).toHaveBeenCalledTimes(2);
        expect(await screen.findAllByText('validation error')).toHaveLength(2);
        expect(screen.queryByText('Products were added to your quote.')).not.toBeInTheDocument();
      });

      it('adds product successfully and does not call validateProduct when NP&OOS setting is enabled', async () => {
        const csvProducts = [
          buildCSVProductWith({
            id: '73737',
            products: {
              productId: '73737',
              variantId: 12345,
              productName: 'CSV Product 1',
              variantSku: 'CSV-001',
              baseSku: 'CSV-001',
            },
            sku: 'CSV-001',
            qty: '2',
          }),
          buildCSVProductWith({
            id: '73738',
            products: {
              productId: '73738',
              variantId: 12346,
              productName: 'CSV Product 2',
              variantSku: 'CSV-002',
              baseSku: 'CSV-002',
            },
            sku: 'CSV-002',
            qty: '3',
          }),
        ];

        const searchProducts = vi.fn<(...arg: unknown[]) => SearchProductsResponse>();

        when(searchProducts)
          .calledWith(expect.stringContaining('productIds: [73737,73738]'))
          .thenReturn({
            data: {
              productsSearch: csvProducts.map((csvProduct) =>
                buildSearchProductWith({
                  id: parseInt(csvProduct.products.productId, 10),
                  name: csvProduct.products.productName,
                  sku: csvProduct.products.variantSku,
                  optionsV3: [],
                  isPriceHidden: false,
                  orderQuantityMinimum: 0,
                  orderQuantityMaximum: 0,
                  inventoryLevel: 100,
                  variants: [
                    buildVariantWith({
                      product_id: parseInt(csvProduct.products.productId, 10),
                      sku: csvProduct.products.variantSku,
                      variant_id: csvProduct.products.variantId,
                    }),
                  ],
                }),
              ),
            },
          });

        const getPriceProducts = vi.fn<(...arg: unknown[]) => PriceProductsResponse>();

        when(getPriceProducts)
          .calledWith({
            storeHash: 'store-hash',
            channelId: 1,
            currencyCode: 'USD',
            items: csvProducts.map((csvProduct) => ({
              productId: parseInt(csvProduct.products.productId, 10),
              variantId: csvProduct.products.variantId,
              options: [],
            })),
            customerGroupId: 0,
          })
          .thenReturn({
            data: {
              priceProducts: csvProducts.map((csvProduct) =>
                buildProductPriceWith({
                  productId: parseInt(csvProduct.products.productId, 10),
                  variantId: csvProduct.products.variantId,
                  options: [],
                }),
              ),
            },
          });

        const getVariantInfoBySkus = vi.fn();

        when(getVariantInfoBySkus)
          .calledWith(expect.stringContaining('variantSkus: ["CSV-001", "CSV-002"]'))
          .thenReturn(() =>
            buildVariantInfoResponseWith({
              data: {
                variantSku: csvProducts.map((csvProduct) =>
                  buildVariantInfoWith({
                    variantSku: csvProduct.products.variantSku,
                    variantId: csvProduct.products.variantId.toString(),
                    productId: csvProduct.products.productId,
                    productName: csvProduct.products.productName,
                    minQuantity: 0,
                    purchasingDisabled: '0',
                    isStock: '1',
                    stock: 50,
                  }),
                ),
              },
            }),
          );

        const validateProduct = vi.fn<(...arg: unknown[]) => ValidateProductResponse>();

        when(validateProduct)
          .calledWith(expect.any(Object))
          .thenReturn({
            data: {
              validateProduct: buildValidateProductWith({ responseType: 'SUCCESS', message: '' }),
            },
          });

        const csvUpload = vi.fn();

        when(csvUpload)
          .calledWith(
            stringContainingAll('sku: "CSV-001"', 'qty: "2"', 'sku: "CSV-002"', 'qty: "3"'),
          )
          .thenReturn({
            data: {
              productUpload: buildCSVUploadWith({
                result: {
                  validProduct: csvProducts,
                },
              }),
            },
          });

        server.use(
          graphql.query('SearchProducts', ({ query }) => HttpResponse.json(searchProducts(query))),
          graphql.query('priceProducts', ({ variables }) =>
            HttpResponse.json(getPriceProducts(variables)),
          ),
          graphql.query('GetVariantInfoBySkus', ({ query }) =>
            HttpResponse.json(getVariantInfoBySkus(query)),
          ),
          graphql.query('ValidateProduct', ({ variables }) =>
            HttpResponse.json(validateProduct(variables)),
          ),
          graphql.mutation('ProductUpload', ({ query }) => {
            return HttpResponse.json(csvUpload(query));
          }),
        );

        const quoteInfo = buildQuoteInfoStateWith({
          draftQuoteInfo: {
            contactInfo: { email: customerEmail },
            billingAddress: noAddress,
            shippingAddress: noAddress,
          },
        });

        renderWithProviders(<QuoteDraft setOpenPage={vi.fn()} />, {
          preloadedState: {
            ...preloadedState,
            quoteInfo,
            global: buildGlobalStateWith({
              blockPendingQuoteNonPurchasableOOS: { isEnableProduct: true },
              featureFlags,
            }),
          },
        });

        await userEvent.click(screen.getByText('Add to quote'));

        const uploadButton = screen.getByRole('button', { name: /bulk upload csv/i });
        await userEvent.click(uploadButton);

        const dialog = await screen.findByRole('dialog', { name: /bulk upload/i });

        const csvContent = 'variant_sku,qty\nCSV-001,2\nCSV-002,3';
        const file = new File([csvContent], 'products.csv', { type: 'text/csv' });

        const dropzoneInput = dialog.querySelector<HTMLInputElement>('input[type="file"]');
        if (!dropzoneInput) {
          throw new Error('File input not found');
        }

        await userEvent.upload(dropzoneInput, [file]);

        await within(dialog).findByText('products.csv');

        const addToListButton = screen.getByRole('button', { name: /add to list/i });
        await userEvent.click(addToListButton);

        expect(validateProduct).not.toHaveBeenCalled();
        expect(await screen.findByText('Products were added to your quote.')).toBeInTheDocument();
      });
    });
  });
});
