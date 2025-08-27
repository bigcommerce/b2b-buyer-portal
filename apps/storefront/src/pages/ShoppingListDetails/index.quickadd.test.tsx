import { PersistPartial } from 'redux-persist/es/persistReducer';
import { when } from 'vitest-when';

import { QuoteInfoState } from '@/store';
import { CompanyStatus, Product, UserTypes } from '@/types';
import { QuoteInfo, QuoteItem } from '@/types/quotes';
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
  userEvent,
  waitFor,
} from 'tests/test-utils';

import QuickAdd from './components/QuickAdd';

const { server } = startMockServer();

const approvedB2BCompany = buildCompanyStateWith({
  permissions: [{ code: 'purchase_enable', permissionLevel: 1 }],
  companyInfo: { status: CompanyStatus.APPROVED },
  customer: { userType: UserTypes.MULTIPLE_B2C },
});

export interface VariantInfoResponse {
  data: {
    variantSku: VariantInfo[];
  };
}

export interface VariantInfo {
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

const buildProductWith = builder<Product>(() => ({
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
    id: faker.string.uuid(),
    productId: faker.number.int(),
    productName: faker.commerce.productName(),
    quantity: faker.number.int({ min: 1, max: 100 }),
    basePrice: faker.number.int(),
    optionList: faker.lorem.word(),
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

const storeInfoWithDateFormat = buildStoreInfoStateWith({ timeFormat: { display: 'j F Y' } });

const preloadedState = { company: approvedB2BCompany, storeInfo: storeInfoWithDateFormat };

it('renders the quick add section', () => {
  renderWithProviders(<QuickAdd quickAddToList={vi.fn()} updateList={vi.fn()} />, {
    preloadedState,
  });

  expect(screen.getByText('Quick add')).toBeInTheDocument();
});

it('increases the number of input rows when clicking -show more rows- button', async () => {
  renderWithProviders(<QuickAdd quickAddToList={vi.fn()} updateList={vi.fn()} />, {
    preloadedState,
  });

  const showMoreRowsButton = screen.getByRole('button', { name: 'Show more rows' });

  expect(screen.getAllByRole('textbox', { name: 'SKU#' })).toHaveLength(3);
  expect(screen.getAllByRole('spinbutton', { name: 'Qty' })).toHaveLength(3);

  await userEvent.click(showMoreRowsButton);

  expect(screen.getAllByRole('textbox', { name: 'SKU#' })).toHaveLength(6);
  expect(screen.getAllByRole('spinbutton', { name: 'Qty' })).toHaveLength(6);
});

it('calls "quickAddToList" with the skus and the quantities when clicking on the -Add product to list- button', async () => {
  const getVariantInfoBySkus = vi.fn();

  const variantInfo = buildVariantInfoWith({
    variantSku: 'S-123',
    minQuantity: 0,
    purchasingDisabled: '0',
    isStock: '1',
  });

  when(getVariantInfoBySkus)
    .calledWith(expect.stringContaining('variantSkus: ["S-123"]'))
    .thenDo(() => buildVariantInfoResponseWith({ data: { variantSku: [variantInfo] } }));

  server.use(
    graphql.query('GetVariantInfoBySkus', ({ query }) =>
      HttpResponse.json(getVariantInfoBySkus(query)),
    ),
  );

  const quickAddToList = vi.fn();

  renderWithProviders(<QuickAdd quickAddToList={quickAddToList} updateList={vi.fn()} />, {
    preloadedState,
  });

  const [skuInput] = screen.getAllByRole('textbox', { name: 'SKU#' });
  const [qtyInput] = screen.getAllByRole('spinbutton', { name: 'Qty' });

  await userEvent.type(skuInput, 'S-123');
  await userEvent.type(qtyInput, '2');

  await userEvent.click(screen.getByRole('button', { name: 'Add product to list' }));

  await waitFor(() =>
    expect(quickAddToList).toHaveBeenCalledWith([
      expect.objectContaining({ variantSku: 'S-123', quantity: 2 }),
    ]),
  );

  expect(skuInput).toHaveValue('');
  expect(qtyInput).toHaveValue(null);
});

it('only clears inputs that were passed to "quickAddToList", keeps the rest', async () => {
  const getVariantInfoBySkus = vi.fn();

  const variantInfo = buildVariantInfoWith({
    variantSku: 'S-123',
    minQuantity: 0,
    purchasingDisabled: '0',
    isStock: '1',
  });

  when(getVariantInfoBySkus)
    .calledWith(expect.stringContaining('variantSkus: ["S-123","S-456"]'))
    .thenDo(() => buildVariantInfoResponseWith({ data: { variantSku: [variantInfo] } }));

  server.use(
    graphql.query('GetVariantInfoBySkus', ({ query }) =>
      HttpResponse.json(getVariantInfoBySkus(query)),
    ),
  );

  const quickAddToList = vi.fn();

  renderWithProviders(<QuickAdd quickAddToList={quickAddToList} updateList={vi.fn()} />, {
    preloadedState,
  });

  const [firstInput, secondSkuInput] = screen.getAllByRole('textbox', { name: 'SKU#' });
  const [firstQtyInput, secondQtyInput] = screen.getAllByRole('spinbutton', { name: 'Qty' });

  await userEvent.type(firstInput, 'S-123');
  await userEvent.type(firstQtyInput, '2');

  await userEvent.type(secondSkuInput, 'S-456');
  await userEvent.type(secondQtyInput, '3');

  await userEvent.click(screen.getByRole('button', { name: 'Add product to list' }));

  expect(
    await screen.findByText('SKU S-456 were not found, please check entered values'),
  ).toBeInTheDocument();

  await waitFor(() =>
    expect(quickAddToList).toHaveBeenCalledWith([
      expect.objectContaining({ variantSku: 'S-123', quantity: 2 }),
    ]),
  );

  expect(firstInput).toHaveValue('');
  expect(firstQtyInput).toHaveValue(null);

  expect(secondSkuInput).toHaveValue('S-456');
  expect(secondQtyInput).toHaveValue(3);
});

it('submits the form when pressing enter on either of the inputs', async () => {
  server.use(
    graphql.query('GetVariantInfoBySkus', () => HttpResponse.json({ data: { variantSku: [] } })),
  );

  renderWithProviders(<QuickAdd quickAddToList={vi.fn()} updateList={vi.fn()} />, {
    preloadedState,
  });

  const [skuInput] = screen.getAllByRole('textbox', { name: 'SKU#' });
  const [qtyInput] = screen.getAllByRole('spinbutton', { name: 'Qty' });

  await userEvent.type(skuInput, 'S-123');
  await userEvent.type(qtyInput, '2{Enter}');

  await waitFor(() => {
    expect(
      screen.getByText('SKU S-123 were not found, please check entered values'),
    ).toBeInTheDocument();
  });

  await userEvent.clear(skuInput);
  await userEvent.type(skuInput, 'S-456{Enter}');

  await waitFor(() => {
    expect(
      screen.getByText('SKU S-456 were not found, please check entered values'),
    ).toBeInTheDocument();
  });
});

describe('when there is a problem with some of the skus', () => {
  it('notifies the sku is not purchasable', async () => {
    const getVariantInfoBySkus = vi.fn();

    const variantInfo = buildVariantInfoWith({
      variantSku: 'S-123',
      minQuantity: 0,
      purchasingDisabled: '1',
      isStock: '1',
      stock: 50,
    });

    when(getVariantInfoBySkus)
      .calledWith(expect.stringContaining('variantSkus: ["S-123"]'))
      .thenDo(() => buildVariantInfoResponseWith({ data: { variantSku: [variantInfo] } }));

    server.use(
      graphql.query('GetVariantInfoBySkus', ({ query }) =>
        HttpResponse.json(getVariantInfoBySkus(query)),
      ),
    );

    renderWithProviders(<QuickAdd quickAddToList={vi.fn()} updateList={vi.fn()} />, {
      preloadedState,
    });

    const [skuInput] = screen.getAllByRole('textbox', { name: 'SKU#' });
    const [qtyInput] = screen.getAllByRole('spinbutton', { name: 'Qty' });

    await userEvent.type(skuInput, 'S-123');
    await userEvent.type(qtyInput, '2');

    await userEvent.click(screen.getByRole('button', { name: 'Add product to list' }));

    await waitFor(() => {
      expect(screen.getByText('SKU S-123 no longer for sale')).toBeInTheDocument();
    });

    expect(skuInput).not.toBeValid();
  });

  it('notifies if the sku quantity is not between 1 and 1,000,000', async () => {
    const getVariantInfoBySkus = vi.fn();

    const variantInfo = buildVariantInfoWith({
      variantSku: 'S-123',
      minQuantity: 1,
      maxQuantity: 2,
      purchasingDisabled: '0',
      isStock: '1',
      stock: 50,
    });

    when(getVariantInfoBySkus)
      .calledWith(expect.stringContaining('variantSkus: ["S-123"]'))
      .thenDo(() => buildVariantInfoResponseWith({ data: { variantSku: [variantInfo] } }));

    server.use(
      graphql.query('GetVariantInfoBySkus', ({ query }) =>
        HttpResponse.json(getVariantInfoBySkus(query)),
      ),
    );

    renderWithProviders(<QuickAdd quickAddToList={vi.fn()} updateList={vi.fn()} />, {
      preloadedState,
    });

    const [skuInput] = screen.getAllByRole('textbox', { name: 'SKU#' });
    const [qtyInput] = screen.getAllByRole('spinbutton', { name: 'Qty' });

    await userEvent.type(skuInput, 'S-123');
    await userEvent.type(qtyInput, '2000000');

    await userEvent.click(screen.getByRole('button', { name: 'Add product to list' }));

    await waitFor(() => {
      expect(
        screen.getByText('SKU S-123 add quantity is limited from 1 to 1,000,000'),
      ).toBeInTheDocument();
    });

    expect(qtyInput).not.toBeValid();
  });
});

describe('when the sku has a required modifier', () => {
  it('notifies the sku is not available for quick add', async () => {
    const getVariantInfoBySkus = vi.fn();

    const variantInfo = buildVariantInfoWith({
      variantSku: 'S-123',
      purchasingDisabled: '0',
      modifiers: [{ required: true, type: [] }],
    });

    when(getVariantInfoBySkus)
      .calledWith(expect.stringContaining('variantSkus: ["S-123"]'))
      .thenDo(() => buildVariantInfoResponseWith({ data: { variantSku: [variantInfo] } }));

    server.use(
      graphql.query('GetVariantInfoBySkus', ({ query }) =>
        HttpResponse.json(getVariantInfoBySkus(query)),
      ),
    );

    renderWithProviders(<QuickAdd quickAddToList={vi.fn()} updateList={vi.fn()} />, {
      preloadedState,
    });

    const [skuInput] = screen.getAllByRole('textbox', { name: 'SKU#' });
    const [qtyInput] = screen.getAllByRole('spinbutton', { name: 'Qty' });

    await userEvent.type(skuInput, 'S-123');
    await userEvent.type(qtyInput, '2');

    await userEvent.click(screen.getByRole('button', { name: 'Add product to list' }));

    await waitFor(() => {
      expect(screen.getByText('SKU S-123 cannot be added quickly')).toBeInTheDocument();
    });

    expect(skuInput).not.toBeValid();
  });
});

describe('when an existing sky on the draft quote is over the quantity limit', () => {
  it('displays a quantity error when additional quantities of the sku are added', async () => {
    const getVariantInfoBySkus = vi.fn();

    const variantSku = 'S-123';

    const draftItemOverLimit = buildDraftQuoteItemWith({
      node: {
        variantSku,
        optionList: '[{ "optionValue": "Some Special Option" }]',
        quantity: 9999999,
        productsSearch: buildProductWith({ sku: 'S-123' }),
      },
    });

    const variantInfo = buildVariantInfoWith({ variantSku, purchasingDisabled: '0' });

    when(getVariantInfoBySkus)
      .calledWith(expect.stringContaining('variantSkus: ["S-123"]'))
      .thenDo(() => buildVariantInfoResponseWith({ data: { variantSku: [variantInfo] } }));

    server.use(
      graphql.query('GetVariantInfoBySkus', ({ query }) =>
        HttpResponse.json(getVariantInfoBySkus(query)),
      ),
    );

    renderWithProviders(<QuickAdd quickAddToList={vi.fn()} updateList={vi.fn()} />, {
      preloadedState: {
        ...preloadedState,
        quoteInfo: buildQuoteInfoStateWith({
          draftQuoteList: [draftItemOverLimit],
        }),
      },
    });

    const [skuInput] = screen.getAllByRole('textbox', { name: 'SKU#' });
    const [qtyInput] = screen.getAllByRole('spinbutton', { name: 'Qty' });

    await userEvent.type(skuInput, 'S-123');
    await userEvent.type(qtyInput, '1');

    await userEvent.click(screen.getByRole('button', { name: 'Add product to list' }));

    await waitFor(() => {
      expect(
        screen.getByText('SKU S-123 add quantity is limited from 1 to 1,000,000'),
      ).toBeInTheDocument();
    });
  });
});

describe('when some data is missing in the form', async () => {
  it('shows an error message when sku or quantity are not provided', async () => {
    renderWithProviders(<QuickAdd quickAddToList={vi.fn()} updateList={vi.fn()} />, {
      preloadedState,
    });

    const [firstSkuInput, secondSkuInput] = screen.getAllByRole('textbox', { name: 'SKU#' });
    const [firstQtyInput, secondQtyInput] = screen.getAllByRole('spinbutton', { name: 'Qty' });

    await userEvent.type(firstSkuInput, 'S-123');
    await userEvent.type(secondQtyInput, '3');

    await userEvent.click(screen.getByRole('button', { name: 'Add product to list' }));

    expect(secondSkuInput).not.toBeValid();
    expect(secondSkuInput).toHaveAccessibleDescription('SKU# is required');

    expect(firstQtyInput).not.toBeValid();
    expect(firstQtyInput).toHaveAccessibleDescription('Qty is required');

    await userEvent.type(firstQtyInput, '2');
    await userEvent.type(secondSkuInput, 'S-123');

    expect(firstSkuInput).toBeValid();
    expect(secondSkuInput).toBeValid();
    expect(firstQtyInput).toBeValid();
    expect(secondQtyInput).toBeValid();
  });

  it('shows an error message when quantity is negative', async () => {
    renderWithProviders(<QuickAdd quickAddToList={vi.fn()} updateList={vi.fn()} />, {
      preloadedState,
    });

    const [skuInput] = screen.getAllByRole('textbox', { name: 'SKU#' });
    const [qtyInput] = screen.getAllByRole('spinbutton', { name: 'Qty' });

    await userEvent.type(skuInput, 'S-123');
    await userEvent.type(qtyInput, '-3');

    await userEvent.click(screen.getByRole('button', { name: 'Add product to list' }));

    expect(qtyInput).not.toBeValid();
    expect(qtyInput).toHaveAccessibleDescription('incorrect number');
  });
});
