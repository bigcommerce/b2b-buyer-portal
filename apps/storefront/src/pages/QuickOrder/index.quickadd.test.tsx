import Cookies from 'js-cookie';
import { set } from 'lodash-es';
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
import { when } from 'vitest-when';

import { GetCart } from '@/shared/service/bc/graphql/cart';
import { CompanyStatus, UserTypes } from '@/types';
import { LineItem } from '@/utils/b3Product/b3Product';

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

interface MoneyValue {
  currencyCode: string;
  value: number;
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

const buildMoneyValueWith = builder<MoneyValue>(() => ({
  currencyCode: faker.finance.currencyCode(),
  value: faker.number.float(),
}));

const buildLineItemWith = builder<LineItem>(() => ({
  variantEntityId: faker.number.int(),
  productEntityId: faker.number.int(),
  sku: faker.string.uuid(),
  quantity: faker.number.int(),
  selectedOptions: [],
}));

const buildCartWith = builder<GetCart>(() => {
  const currencyCode = faker.finance.currencyCode();

  return {
    data: {
      site: {
        cart: {
          amount: buildMoneyValueWith({ currencyCode }),
          baseAmount: buildMoneyValueWith({ currencyCode }),
          currencyCode,
          discountedAmount: buildMoneyValueWith({ currencyCode }),
          discounts: [],
          isTaxIncluded: faker.datatype.boolean(),
          locale: faker.helpers.arrayElement(['en', 'es', 'fr']),
          entityId: faker.string.uuid(),
          lineItems: {
            physicalItems: bulk(buildLineItemWith, 'WHATEVER_VALUES').times(
              faker.number.int({ min: 1, max: 5 }),
            ),
            digitalItems: bulk(buildLineItemWith, 'WHATEVER_VALUES').times(
              faker.number.int({ min: 1, max: 5 }),
            ),
            giftCertificates: bulk(buildLineItemWith, 'WHATEVER_VALUES').times(
              faker.number.int({ min: 1, max: 5 }),
            ),
            customItems: bulk(buildLineItemWith, 'WHATEVER_VALUES').times(
              faker.number.int({ min: 1, max: 5 }),
            ),
          },
        },
      },
    },
  };
});

const storeInfoWithDateFormat = buildStoreInfoStateWith({ timeFormat: { display: 'j F Y' } });

const preloadedState = { company: approvedB2BCompany, storeInfo: storeInfoWithDateFormat };

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

  server.use(
    graphql.query('GetVariantInfoBySkus', ({ query }) =>
      HttpResponse.json(getVariantInfoBySkus(query)),
    ),
    graphql.query('getCart', () => HttpResponse.json<GetCart>({ data: { site: { cart: null } } })),
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

  server.use(
    graphql.query('GetVariantInfoBySkus', ({ query }) =>
      HttpResponse.json(getVariantInfoBySkus(query)),
    ),
    graphql.query('getCart', () => HttpResponse.json<GetCart>({ data: { site: { cart: null } } })),
    graphql.mutation('createCartSimple', ({ variables }) =>
      HttpResponse.json(createCartSimple(variables)),
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
    await screen.findByText('SKU S-456 were not found, please check entered values'),
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
  it('notifies the sku did not have enough stock', async () => {
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

    server.use(
      graphql.query('GetVariantInfoBySkus', ({ query }) =>
        HttpResponse.json(getVariantInfoBySkus(query)),
      ),
      graphql.query('getCart', () =>
        HttpResponse.json<GetCart>({ data: { site: { cart: null } } }),
      ),
    );

    renderWithProviders(<QuickOrderPad />, { preloadedState });

    const [skuInput] = screen.getAllByRole('textbox', { name: 'SKU#' });
    const [qtyInput] = screen.getAllByRole('spinbutton', { name: 'Qty' });

    await userEvent.type(skuInput, 'S-123');
    await userEvent.type(qtyInput, '100');

    await userEvent.click(screen.getByRole('button', { name: 'Add products to cart' }));

    await waitFor(() => {
      expect(
        screen.getByText('S-123 does not have enough stock, please change the quantity'),
      ).toBeInTheDocument();
    });

    expect(qtyInput).not.toBeValid();
    expect(qtyInput).toHaveAccessibleDescription('50 in stock');
  });

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
      graphql.query('getCart', () =>
        HttpResponse.json<GetCart>({ data: { site: { cart: null } } }),
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

  it('notifies the min number of items was not purchased', async () => {
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

    server.use(
      graphql.query('GetVariantInfoBySkus', ({ query }) =>
        HttpResponse.json(getVariantInfoBySkus(query)),
      ),
      graphql.query('getCart', () =>
        HttpResponse.json<GetCart>({ data: { site: { cart: null } } }),
      ),
    );

    renderWithProviders(<QuickOrderPad />, { preloadedState });

    const [skuInput] = screen.getAllByRole('textbox', { name: 'SKU#' });
    const [qtyInput] = screen.getAllByRole('spinbutton', { name: 'Qty' });

    await userEvent.type(skuInput, 'S-123');
    await userEvent.type(qtyInput, '2');

    await userEvent.click(screen.getByRole('button', { name: 'Add products to cart' }));

    await waitFor(() => {
      expect(
        screen.getByText('You need to purchase a minimum of 3 of the S-123 per order'),
      ).toBeInTheDocument();
    });

    expect(qtyInput).not.toBeValid();
    expect(qtyInput).toHaveAccessibleDescription('Min is 3');
  });

  it('notifies the max number of items was exceeded', async () => {
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
      graphql.query('getCart', () =>
        HttpResponse.json<GetCart>({ data: { site: { cart: null } } }),
      ),
    );

    renderWithProviders(<QuickOrderPad />, { preloadedState });

    const [skuInput] = screen.getAllByRole('textbox', { name: 'SKU#' });
    const [qtyInput] = screen.getAllByRole('spinbutton', { name: 'Qty' });

    await userEvent.type(skuInput, 'S-123');
    await userEvent.type(qtyInput, '4');

    await userEvent.click(screen.getByRole('button', { name: 'Add products to cart' }));

    await waitFor(() => {
      expect(
        screen.getByText('You need to purchase a maximum of 2 of the S-123 per order'),
      ).toBeInTheDocument();
    });

    expect(qtyInput).not.toBeValid();
    expect(qtyInput).toHaveAccessibleDescription('Max is 2');
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
        screen.getByText('SKU S-123,S-456 were not found, please check entered values'),
      ).toBeInTheDocument();
    });

    expect(firstSkuInput).not.toBeValid();
    expect(secondSkuInput).not.toBeValid();
  });

  describe('takes existing cart into account', () => {
    it('notifies the sku did not have enough stock', async () => {
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

      server.use(
        graphql.query('GetVariantInfoBySkus', ({ query }) =>
          HttpResponse.json(getVariantInfoBySkus(query)),
        ),
        graphql.query('getCart', () =>
          HttpResponse.json<GetCart>(
            buildCartWith({
              data: {
                site: {
                  cart: {
                    lineItems: {
                      physicalItems: [
                        buildLineItemWith({
                          sku: 'S-123',
                          quantity: 30,
                          variantEntityId: Number(variantInfo.variantId),
                          productEntityId: Number(variantInfo.productId),
                        }),
                      ],
                    },
                  },
                },
              },
            }),
          ),
        ),
      );

      renderWithProviders(<QuickOrderPad />, { preloadedState });

      const [skuInput] = screen.getAllByRole('textbox', { name: 'SKU#' });
      const [qtyInput] = screen.getAllByRole('spinbutton', { name: 'Qty' });

      await userEvent.type(skuInput, 'S-123');
      await userEvent.type(qtyInput, '30');

      await userEvent.click(screen.getByRole('button', { name: 'Add products to cart' }));

      await waitFor(() => {
        expect(
          screen.getByText('S-123 does not have enough stock, please change the quantity'),
        ).toBeInTheDocument();
      });

      expect(qtyInput).not.toBeValid();
      expect(qtyInput).toHaveAccessibleDescription('50 in stock');
    });

    it('can add if cart + new quantity exceed the minimum', async () => {
      const getVariantInfoBySkus = vi.fn();

      const variantInfo = buildVariantInfoWith({
        variantSku: 'S-123',
        minQuantity: 5,
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
        graphql.query('getCart', () =>
          HttpResponse.json<GetCart>(
            buildCartWith({
              data: {
                site: {
                  cart: {
                    lineItems: {
                      physicalItems: [
                        buildLineItemWith({
                          sku: 'S-123',
                          quantity: 3,
                          variantEntityId: Number(variantInfo.variantId),
                          productEntityId: Number(variantInfo.productId),
                        }),
                      ],
                    },
                  },
                },
              },
            }),
          ),
        ),
        graphql.mutation('addCartLineItemsTwo', () =>
          HttpResponse.json({
            data: { cart: { addCartLineItems: buildCartWith('WHATEVER_VALUES').data.site } },
          }),
        ),
      );

      renderWithProviders(<QuickOrderPad />, { preloadedState });

      const [skuInput] = screen.getAllByRole('textbox', { name: 'SKU#' });
      const [qtyInput] = screen.getAllByRole('spinbutton', { name: 'Qty' });

      await userEvent.type(skuInput, 'S-123');
      await userEvent.type(qtyInput, '3');

      await userEvent.click(screen.getByRole('button', { name: 'Add products to cart' }));

      await waitFor(() => {
        expect(screen.getByText('Products were added to cart')).toBeInTheDocument();
      });
    });

    it('notifies the max number of items was exceeded', async () => {
      const getVariantInfoBySkus = vi.fn();

      const variantInfo = buildVariantInfoWith({
        variantSku: 'S-123',
        minQuantity: 1,
        maxQuantity: 10,
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
        graphql.query('getCart', () =>
          HttpResponse.json<GetCart>(
            buildCartWith({
              data: {
                site: {
                  cart: {
                    lineItems: {
                      physicalItems: [
                        buildLineItemWith({
                          sku: 'S-123',
                          quantity: 5,
                          variantEntityId: Number(variantInfo.variantId),
                          productEntityId: Number(variantInfo.productId),
                        }),
                      ],
                    },
                  },
                },
              },
            }),
          ),
        ),
      );

      renderWithProviders(<QuickOrderPad />, { preloadedState });

      const [skuInput] = screen.getAllByRole('textbox', { name: 'SKU#' });
      const [qtyInput] = screen.getAllByRole('spinbutton', { name: 'Qty' });

      await userEvent.type(skuInput, 'S-123');
      await userEvent.type(qtyInput, '6');

      await userEvent.click(screen.getByRole('button', { name: 'Add products to cart' }));

      await waitFor(() => {
        expect(
          screen.getByText('You need to purchase a maximum of 10 of the S-123 per order'),
        ).toBeInTheDocument();
      });

      expect(qtyInput).not.toBeValid();
      expect(qtyInput).toHaveAccessibleDescription('Max is 10');
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
          screen.getByText('SKU S-123,S-456 were not found, please check entered values'),
        ).toBeInTheDocument();
      });

      expect(firstSkuInput).not.toBeValid();
      expect(secondSkuInput).not.toBeValid();
    });
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
