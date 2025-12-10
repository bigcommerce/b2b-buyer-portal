import Cookies from 'js-cookie';
import { set } from 'lodash-es';
import {
  buildCompanyStateWith,
  builder,
  buildGlobalStateWith,
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
import { when } from 'vitest-when';

import { GetCart } from '@/shared/service/bc/graphql/cart';
import { CompanyStatus, UserTypes } from '@/types';

import QuickOrderPad from './components/QuickOrderPad';

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

const storeInfoWithDateFormat = buildStoreInfoStateWith({ timeFormat: { display: 'j F Y' } });

const preloadedState = {
  company: approvedB2BCompany,
  storeInfo: storeInfoWithDateFormat,
  global: buildGlobalStateWith({
    featureFlags: {
      'B2B-3318.move_stock_and_backorder_validation_to_backend': true,
    },
  }),
};

beforeEach(() => {
  set(window, 'b2b.callbacks.dispatchEvent', vi.fn());
});

it('renders the quick add section', () => {
  renderWithProviders(<QuickOrderPad />, { preloadedState });

  expect(screen.getByText('Quick add')).toBeInTheDocument();
});

it('increases the number of input rows when clicking -show more rows- button', async () => {
  renderWithProviders(<QuickOrderPad />, { preloadedState });

  const showMoreRowsButton = screen.getByRole('button', { name: 'Show more rows' });

  expect(screen.getAllByRole('textbox', { name: 'SKU#' })).toHaveLength(3);
  expect(screen.getAllByRole('spinbutton', { name: 'Qty' })).toHaveLength(3);

  await userEvent.click(showMoreRowsButton);

  expect(screen.getAllByRole('textbox', { name: 'SKU#' })).toHaveLength(6);
  expect(screen.getAllByRole('spinbutton', { name: 'Qty' })).toHaveLength(6);
});

it('adds the skus and the quantities to the cart when clicking on the -add to cart- button', async () => {
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

  const createCartSimple = vi.fn();

  when(createCartSimple)
    .calledWith({
      createCartInput: {
        lineItems: [
          {
            quantity: 2,
            productEntityId: Number(variantInfo.productId),
            variantEntityId: Number(variantInfo.variantId),
            selectedOptions: {
              multipleChoices: [],
              textFields: [],
            },
          },
        ],
      },
    })
    .thenReturn({
      data: {
        cart: { createCart: { cart: { entityId: 'de435179-9b4b-4fa4-b609-34d948d04783' } } },
      },
    });

  const validateProduct = when(vi.fn())
    .calledWith(expect.objectContaining({ productId: Number(variantInfo.productId) }))
    .thenReturn({ data: { validateProduct: { responseType: 'SUCCESS', message: '' } } });
  when(validateProduct)
    .calledWith(expect.objectContaining({ productId: Number(variantInfo.productId) }))
    .thenReturn({ data: { validateProduct: { responseType: 'SUCCESS', message: '' } } });

  server.use(
    graphql.query('GetVariantInfoBySkus', ({ query }) =>
      HttpResponse.json(getVariantInfoBySkus(query)),
    ),
    graphql.query('getCart', () => HttpResponse.json<GetCart>({ data: { site: { cart: null } } })),
    graphql.query('ValidateProduct', ({ variables }) =>
      HttpResponse.json(validateProduct(variables)),
    ),
    graphql.mutation('createCartSimple', ({ variables }) =>
      HttpResponse.json(createCartSimple(variables)),
    ),
  );

  renderWithProviders(<QuickOrderPad />, { preloadedState });

  const [skuInput] = screen.getAllByRole('textbox', { name: 'SKU#' });
  const [qtyInput] = screen.getAllByRole('spinbutton', { name: 'Qty' });

  await userEvent.type(skuInput, 'S-123');
  await userEvent.type(qtyInput, '2');

  await userEvent.click(screen.getByRole('button', { name: 'Add products to cart' }));

  expect(await screen.findByText('Products were added to cart')).toBeInTheDocument();

  expect(window.b2b.callbacks.dispatchEvent).toHaveBeenCalledWith('on-cart-created', {
    cartId: 'de435179-9b4b-4fa4-b609-34d948d04783',
  });

  expect(Cookies.get('cartId')).toBe('de435179-9b4b-4fa4-b609-34d948d04783');

  expect(skuInput).toHaveValue('');
  expect(qtyInput).toHaveValue(null);
});

it('only clears inputs that are added to the cart, keeps the rest', async () => {
  const variantInfo = buildVariantInfoWith({
    variantSku: 'S-123',
    minQuantity: 0,
    purchasingDisabled: '0',
    isStock: '1',
  });

  const getVariantInfoBySkus = when(vi.fn())
    .calledWith(expect.stringContaining('variantSkus: ["S-123","S-456"]'))
    .thenDo(() => buildVariantInfoResponseWith({ data: { variantSku: [variantInfo] } }));

  const createCartSimple = when(vi.fn())
    .calledWith({
      createCartInput: {
        lineItems: [
          {
            quantity: 2,
            productEntityId: Number(variantInfo.productId),
            variantEntityId: Number(variantInfo.variantId),
            selectedOptions: {
              multipleChoices: [],
              textFields: [],
            },
          },
        ],
      },
    })
    .thenReturn({
      data: {
        cart: { createCart: { cart: { entityId: 'de435179-9b4b-4fa4-b609-34d948d04783' } } },
      },
    });

  const validateProduct = when(vi.fn())
    .calledWith(expect.objectContaining({ productId: Number(variantInfo.productId) }))
    .thenReturn({ data: { validateProduct: { responseType: 'SUCCESS', message: '' } } });

  server.use(
    graphql.query('GetVariantInfoBySkus', ({ query }) =>
      HttpResponse.json(getVariantInfoBySkus(query)),
    ),
    graphql.query('getCart', () => HttpResponse.json<GetCart>({ data: { site: { cart: null } } })),
    graphql.mutation('createCartSimple', ({ variables }) =>
      HttpResponse.json(createCartSimple(variables)),
    ),
    graphql.query('ValidateProduct', ({ variables }) =>
      HttpResponse.json(validateProduct(variables)),
    ),
  );

  renderWithProviders(<QuickOrderPad />, { preloadedState });

  const [firstInput, secondSkuInput] = screen.getAllByRole('textbox', { name: 'SKU#' });
  const [firstQtyInput, secondQtyInput] = screen.getAllByRole('spinbutton', { name: 'Qty' });

  await userEvent.type(firstInput, 'S-123');
  await userEvent.type(firstQtyInput, '2');

  await userEvent.type(secondSkuInput, 'S-456');
  await userEvent.type(secondQtyInput, '3');

  await userEvent.click(screen.getByRole('button', { name: 'Add products to cart' }));

  expect(
    await screen.findByText('SKU S-456 was not found, please check entered values'),
  ).toBeInTheDocument();

  expect(await screen.findByText('Products were added to cart')).toBeInTheDocument();

  expect(window.b2b.callbacks.dispatchEvent).toHaveBeenCalledWith('on-cart-created', {
    cartId: 'de435179-9b4b-4fa4-b609-34d948d04783',
  });

  expect(Cookies.get('cartId')).toBe('de435179-9b4b-4fa4-b609-34d948d04783');

  expect(firstInput).toHaveValue('');
  expect(firstQtyInput).toHaveValue(null);

  expect(secondSkuInput).toHaveValue('S-456');
  expect(secondQtyInput).toHaveValue(3);
});

it('submits the form when pressing enter on either of the inputs', async () => {
  server.use(
    graphql.query('GetVariantInfoBySkus', () => HttpResponse.json({ data: { variantSku: [] } })),
    graphql.query('getCart', () => HttpResponse.json<GetCart>({ data: { site: { cart: null } } })),
  );

  renderWithProviders(<QuickOrderPad />, { preloadedState });

  const [skuInput] = screen.getAllByRole('textbox', { name: 'SKU#' });
  const [qtyInput] = screen.getAllByRole('spinbutton', { name: 'Qty' });

  await userEvent.type(skuInput, 'S-123');
  await userEvent.type(qtyInput, '2{Enter}');

  await waitFor(() => {
    expect(
      screen.getByText('SKU S-123 was not found, please check entered values'),
    ).toBeInTheDocument();
  });

  await userEvent.clear(skuInput);
  await userEvent.type(skuInput, 'S-456{Enter}');

  await waitFor(() => {
    expect(
      screen.getByText('SKU S-456 was not found, please check entered values'),
    ).toBeInTheDocument();
  });
});

describe('when there is a problem with some of the skus', () => {
  it('notifies about OOS errors with the sku', async () => {
    const getVariantInfoBySkus = vi.fn();

    const variantInfo = buildVariantInfoWith({
      variantSku: 'S-123',
      minQuantity: 0,
      purchasingDisabled: '0',
      isStock: '1',
      stock: 50,
    });

    when(getVariantInfoBySkus)
      .calledWith(expect.stringContaining('variantSkus: ["S-123"]'))
      .thenDo(() => buildVariantInfoResponseWith({ data: { variantSku: [variantInfo] } }));

    const validateProduct = when(vi.fn())
      .calledWith(expect.objectContaining({ productId: Number(variantInfo.productId) }))
      .thenReturn({
        data: {
          validateProduct: {
            responseType: 'ERROR',
            message: 'S-123 does not have enough stock, please change the quantity',
            errorCode: 'OOS',
            product: {
              availableToSell: 50,
            },
          },
        },
      });

    server.use(
      graphql.query('GetVariantInfoBySkus', ({ query }) =>
        HttpResponse.json(getVariantInfoBySkus(query)),
      ),
      graphql.query('getCart', () =>
        HttpResponse.json<GetCart>({ data: { site: { cart: null } } }),
      ),
      graphql.query('ValidateProduct', ({ variables }) =>
        HttpResponse.json(validateProduct(variables)),
      ),
    );

    renderWithProviders(<QuickOrderPad />, { preloadedState });

    const [skuInput] = screen.getAllByRole('textbox', { name: 'SKU#' });
    const [qtyInput] = screen.getAllByRole('spinbutton', { name: 'Qty' });

    await userEvent.type(skuInput, 'S-123');
    await userEvent.type(qtyInput, '10');

    await userEvent.click(screen.getByRole('button', { name: 'Add products to cart' }));

    await waitFor(() => {
      expect(
        screen.getByText('S-123 does not have enough stock, please change the quantity'),
      ).toBeInTheDocument();
    });

    expect(qtyInput).not.toBeValid();
    expect(qtyInput).toHaveAccessibleDescription('50 available');
  });

  it('notifies about warnings with the sku', async () => {
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

    const validateProduct = when(vi.fn())
      .calledWith(expect.objectContaining({ productId: Number(variantInfo.productId) }))
      .thenReturn({
        data: {
          validateProduct: {
            responseType: 'WARNING',
            message: 'SKU S-123 no longer for sale',
          },
        },
      });

    server.use(
      graphql.query('GetVariantInfoBySkus', ({ query }) =>
        HttpResponse.json(getVariantInfoBySkus(query)),
      ),
      graphql.query('getCart', () =>
        HttpResponse.json<GetCart>({ data: { site: { cart: null } } }),
      ),
      graphql.query('ValidateProduct', ({ variables }) =>
        HttpResponse.json(validateProduct(variables)),
      ),
    );

    renderWithProviders(<QuickOrderPad />, { preloadedState });

    const [skuInput] = screen.getAllByRole('textbox', { name: 'SKU#' });
    const [qtyInput] = screen.getAllByRole('spinbutton', { name: 'Qty' });

    await userEvent.type(skuInput, 'S-123');
    await userEvent.type(qtyInput, '2');

    await userEvent.click(screen.getByRole('button', { name: 'Add products to cart' }));

    await waitFor(() => {
      expect(screen.getByText('SKU S-123 no longer for sale')).toBeInTheDocument();
    });

    expect(skuInput).not.toBeValid();
  });

  it('user is notified of INVALID_FIELDS errors with the sku', async () => {
    const getVariantInfoBySkus = vi.fn();

    const variantInfo = buildVariantInfoWith({
      variantSku: 'S-123',
      minQuantity: 3,
      purchasingDisabled: '0',
      isStock: '1',
      stock: 50,
    });

    when(getVariantInfoBySkus)
      .calledWith(expect.stringContaining('variantSkus: ["S-123"]'))
      .thenDo(() => buildVariantInfoResponseWith({ data: { variantSku: [variantInfo] } }));

    const validateProduct = when(vi.fn())
      .calledWith(expect.objectContaining({ productId: Number(variantInfo.productId) }))
      .thenReturn({
        data: {
          validateProduct: {
            responseType: 'ERROR',
            errorCode: 'INVALID_FIELDS',
            message: 'SKU S-123 is invalid',
            product: {
              availableToSell: 0,
            },
          },
        },
      });

    server.use(
      graphql.query('GetVariantInfoBySkus', ({ query }) =>
        HttpResponse.json(getVariantInfoBySkus(query)),
      ),
      graphql.query('getCart', () =>
        HttpResponse.json<GetCart>({ data: { site: { cart: null } } }),
      ),
      graphql.query('ValidateProduct', ({ variables }) =>
        HttpResponse.json(validateProduct(variables)),
      ),
    );

    renderWithProviders(<QuickOrderPad />, { preloadedState });

    const [skuInput] = screen.getAllByRole('textbox', { name: 'SKU#' });
    const [qtyInput] = screen.getAllByRole('spinbutton', { name: 'Qty' });

    await userEvent.type(skuInput, 'S-123');
    await userEvent.type(qtyInput, '2');

    await userEvent.click(screen.getByRole('button', { name: 'Add products to cart' }));

    await waitFor(() => {
      expect(screen.getByText('SKU S-123 is invalid')).toBeInTheDocument();
    });

    expect(skuInput).not.toBeValid();
  });

  it('notifies about NON_PURCHASABLE errors with the sku', async () => {
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

    const validateProduct = when(vi.fn())
      .calledWith(expect.objectContaining({ productId: Number(variantInfo.productId) }))
      .thenReturn({
        data: {
          validateProduct: {
            responseType: 'ERROR',
            errorCode: 'NON_PURCHASABLE',
            message: 'SKU S-123 is non purchasable',
            product: {
              availableToSell: 0,
            },
          },
        },
      });

    server.use(
      graphql.query('GetVariantInfoBySkus', ({ query }) =>
        HttpResponse.json(getVariantInfoBySkus(query)),
      ),
      graphql.query('getCart', () =>
        HttpResponse.json<GetCart>({ data: { site: { cart: null } } }),
      ),
      graphql.query('ValidateProduct', ({ variables }) =>
        HttpResponse.json(validateProduct(variables)),
      ),
    );

    renderWithProviders(<QuickOrderPad />, { preloadedState });

    const [skuInput] = screen.getAllByRole('textbox', { name: 'SKU#' });
    const [qtyInput] = screen.getAllByRole('spinbutton', { name: 'Qty' });

    await userEvent.type(skuInput, 'S-123');
    await userEvent.type(qtyInput, '4');

    await userEvent.click(screen.getByRole('button', { name: 'Add products to cart' }));

    await waitFor(() => {
      expect(screen.getByText('SKU S-123 is non purchasable')).toBeInTheDocument();
    });

    expect(skuInput).not.toBeValid();
  });

  it('notifies the sku was not found', async () => {
    const getVariantInfoBySkus = vi.fn();

    when(getVariantInfoBySkus)
      .calledWith(expect.stringContaining('variantSkus: ["S-123","S-456"]'))
      .thenDo(() => buildVariantInfoResponseWith({ data: { variantSku: [] } }));

    server.use(
      graphql.query('GetVariantInfoBySkus', ({ query }) =>
        HttpResponse.json(getVariantInfoBySkus(query)),
      ),
      graphql.query('getCart', () =>
        HttpResponse.json<GetCart>({ data: { site: { cart: null } } }),
      ),
    );

    renderWithProviders(<QuickOrderPad />, { preloadedState });

    const [firstSkuInput, secondSkuInput] = screen.getAllByRole('textbox', { name: 'SKU#' });
    const [firstQtyInput, secondQtyInput] = screen.getAllByRole('spinbutton', { name: 'Qty' });

    await userEvent.type(firstSkuInput, 'S-123');
    await userEvent.type(firstQtyInput, '4');

    await userEvent.type(secondSkuInput, 'S-456');
    await userEvent.type(secondQtyInput, '2');

    await userEvent.click(screen.getByRole('button', { name: 'Add products to cart' }));

    await waitFor(() => {
      expect(
        screen.getByText('SKUs S-123, S-456 were not found, please check entered values'),
      ).toBeInTheDocument();
    });

    expect(firstSkuInput).not.toBeValid();
    expect(secondSkuInput).not.toBeValid();
  });
});

describe('when some data is missing in the form', async () => {
  it('shows an error message when sku or quantity are not provided', async () => {
    renderWithProviders(<QuickOrderPad />, { preloadedState });

    const [firstSkuInput, secondSkuInput] = screen.getAllByRole('textbox', { name: 'SKU#' });
    const [firstQtyInput, secondQtyInput] = screen.getAllByRole('spinbutton', { name: 'Qty' });

    await userEvent.type(firstSkuInput, 'S-123');
    await userEvent.type(secondQtyInput, '3');

    await userEvent.click(screen.getByRole('button', { name: 'Add products to cart' }));

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
    renderWithProviders(<QuickOrderPad />, { preloadedState });

    const [skuInput] = screen.getAllByRole('textbox', { name: 'SKU#' });
    const [qtyInput] = screen.getAllByRole('spinbutton', { name: 'Qty' });

    await userEvent.type(skuInput, 'S-123');
    await userEvent.type(qtyInput, '-3');

    await userEvent.click(screen.getByRole('button', { name: 'Add products to cart' }));

    expect(qtyInput).not.toBeValid();
    expect(qtyInput).toHaveAccessibleDescription('incorrect number');
  });
});

it('clears skus/quantities regardless of their casing', async () => {
  const variantInfo = buildVariantInfoWith({
    variantSku: 'LOWER-CASE-SKU',
    minQuantity: 0,
    purchasingDisabled: '0',
    isStock: '1',
  });

  const variantInfo2 = buildVariantInfoWith({
    variantSku: 'UPPER-CASE-SKU',
    minQuantity: 0,
    purchasingDisabled: '0',
    isStock: '1',
  });

  const getVariantInfoBySkus = when(vi.fn())
    .calledWith(expect.stringContaining('variantSkus: ["lower-case-sku","UPPER-CASE-SKU"]'))
    .thenReturn(
      buildVariantInfoResponseWith({ data: { variantSku: [variantInfo, variantInfo2] } }),
    );

  const createCartSimple = when(vi.fn())
    .calledWith({
      createCartInput: {
        lineItems: [
          {
            quantity: 2,
            productEntityId: Number(variantInfo.productId),
            variantEntityId: Number(variantInfo.variantId),
            selectedOptions: { multipleChoices: [], textFields: [] },
          },
          {
            quantity: 2,
            productEntityId: Number(variantInfo2.productId),
            variantEntityId: Number(variantInfo2.variantId),
            selectedOptions: { multipleChoices: [], textFields: [] },
          },
        ],
      },
    })
    .thenReturn({
      data: {
        cart: { createCart: { cart: { entityId: 'de435179-9b4b-4fa4-b609-34d948d04783' } } },
      },
    });

  const validateProduct = when(vi.fn())
    .calledWith(expect.objectContaining({ productId: Number(variantInfo.productId) }))
    .thenReturn({ data: { validateProduct: { responseType: 'SUCCESS', message: '' } } });

  when(validateProduct)
    .calledWith(expect.objectContaining({ productId: Number(variantInfo2.productId) }))
    .thenReturn({ data: { validateProduct: { responseType: 'SUCCESS', message: '' } } });

  server.use(
    graphql.query('GetVariantInfoBySkus', ({ query }) =>
      HttpResponse.json(getVariantInfoBySkus(query)),
    ),
    graphql.query('getCart', () => HttpResponse.json<GetCart>({ data: { site: { cart: null } } })),
    graphql.mutation('createCartSimple', ({ variables }) =>
      HttpResponse.json(createCartSimple(variables)),
    ),
    graphql.query('ValidateProduct', ({ variables }) =>
      HttpResponse.json(validateProduct(variables)),
    ),
  );

  renderWithProviders(<QuickOrderPad />, { preloadedState });

  const [skuInput, skuInput2] = screen.getAllByRole('textbox', { name: 'SKU#' });
  const [qtyInput, qtyInput2] = screen.getAllByRole('spinbutton', { name: 'Qty' });

  await userEvent.type(skuInput, 'lower-case-sku');
  await userEvent.type(qtyInput, '2');

  await userEvent.type(skuInput2, 'UPPER-CASE-SKU');
  await userEvent.type(qtyInput2, '2');

  await userEvent.click(screen.getByRole('button', { name: 'Add products to cart' }));

  await waitFor(() => {
    expect(screen.getByText('Products were added to cart')).toBeInTheDocument();
  });

  expect(skuInput).toHaveValue('');
  expect(qtyInput).toHaveValue(null);

  expect(skuInput2).toHaveValue('');
  expect(qtyInput2).toHaveValue(null);

  expect(window.b2b.callbacks.dispatchEvent).toHaveBeenCalledWith('on-cart-created', {
    cartId: 'de435179-9b4b-4fa4-b609-34d948d04783',
  });

  expect(Cookies.get('cartId')).toBe('de435179-9b4b-4fa4-b609-34d948d04783');
});
