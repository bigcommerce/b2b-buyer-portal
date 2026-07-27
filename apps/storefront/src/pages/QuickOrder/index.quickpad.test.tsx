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
  stringContainingAll,
  userEvent,
  waitFor,
  within,
} from 'tests/test-utils';
import { when } from 'vitest-when';

import { PriceProductsResponse } from '@/shared/service/b2b/graphql/global';
import { SearchProductsResponse } from '@/shared/service/b2b/graphql/product';
import { GetCart } from '@/shared/service/bc/graphql/cart';
import { CompanyStatus, UserTypes } from '@/types';
import { LineItem } from '@/utils/b3Product/b3Product';

import QuickOrderPad from './components/QuickOrderPad';

const { server } = startMockServer();

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

const buildMoneyWith = builder(() => ({
  currencyCode: faker.finance.currencyCode(),
  value: faker.number.float(),
}));

const buildCartItemWith = builder<LineItem>(() => ({
  name: faker.commerce.productName(),
  quantity: faker.number.int(),
  productEntityId: faker.number.int(),
  variantEntityId: faker.number.int(),
  sku: faker.string.uuid(),
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

const buildVariantOptionsWith = builder(() => ({
  id: faker.number.int(),
  label: faker.commerce.productAdjective(),
  option_id: faker.number.int(),
  option_display_name: faker.commerce.productMaterial(),
}));

const buildVariantWith = builder<SearchProduct['variants'][number]>(() => ({
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
  bc_calculated_price: {
    as_entered: Number(faker.commerce.price()),
    tax_inclusive: Number(faker.commerce.price()),
    tax_exclusive: Number(faker.commerce.price()),
    entered_inclusive: faker.datatype.boolean(),
  },
  available_to_sell: faker.number.int(),
  unlimited_backorder: faker.datatype.boolean(),
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

const buildGetCartWith = builder<GetCart>(() => {
  const currencyCode = faker.finance.currencyCode();

  return {
    data: {
      site: {
        cart: {
          entityId: faker.string.uuid(),
          lineItems: {
            physicalItems: bulk(buildCartItemWith, 'WHATEVER_VALUES').times(
              faker.number.int({ min: 0, max: 10 }),
            ),
            digitalItems: bulk(buildCartItemWith, 'WHATEVER_VALUES').times(
              faker.number.int({ min: 0, max: 10 }),
            ),
            customItems: bulk(buildCartItemWith, 'WHATEVER_VALUES').times(
              faker.number.int({ min: 0, max: 10 }),
            ),
            giftCertificates: bulk(buildCartItemWith, 'WHATEVER_VALUES').times(
              faker.number.int({ min: 0, max: 10 }),
            ),
          },
          amount: buildMoneyWith({ currencyCode }),
          baseAmount: buildMoneyWith({ currencyCode }),
          discountedAmount: buildMoneyWith({ currencyCode }),
          discounts: [],
          currencyCode,
          isTaxIncluded: faker.datatype.boolean(),
          locale: faker.helpers.arrayElement(['en', 'fr', 'de', 'es']),
        },
      },
    },
  };
});

type SearchProduct = SearchProductsResponse['data']['productsSearch'][number];
type SearchProductV3Option = SearchProduct['optionsV3'][number];
type SearchProductV3OptionValue = SearchProductV3Option['option_values'][number];

const approvedB2BCompany = buildCompanyStateWith({
  permissions: [{ code: 'purchase_enable', permissionLevel: 1 }],
  companyInfo: { status: CompanyStatus.APPROVED },
  customer: { userType: UserTypes.MULTIPLE_B2C },
});

const storeInfoWithDateFormat = buildStoreInfoStateWith({ timeFormat: { display: 'j F Y' } });

const preloadedState = { company: approvedB2BCompany, storeInfo: storeInfoWithDateFormat };

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
  inventoryTracking?: string;
  availableToSell?: number;
  unlimitedBackorder?: boolean;
  totalOnHand?: number | null;
  backorderMessage?: string | null;
}

interface VariantInfoResponse {
  data: {
    variantSku: VariantInfo[];
  };
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
    variantSku: [],
  },
}));

const backorderPreloadedState = {
  company: approvedB2BCompany,
  storeInfo: storeInfoWithDateFormat,
  global: buildGlobalStateWith({
    backorderEnabled: true,
    backorderDisplaySettings: {
      showQuantityOnBackorder: true,
      showQuantityOnHand: true,
      showBackorderMessage: true,
      showDefaultShippingExpectationPrompt: false,
      defaultShippingExpectationPrompt: '',
    },
    featureFlags: {
      'BACK-134.backorders_phase_1_1_control_messaging_on_storefront': true,
    },
  }),
};

beforeEach(() => {
  set(window, 'b2b.callbacks.dispatchEvent', vi.fn());
});

describe('when search returns no results', () => {
  it('shows a modal with no results and lets you perform a new search', async () => {
    renderWithProviders(<QuickOrderPad />, { preloadedState });

    expect(await screen.findByRole('heading', { name: 'Quick order pad' })).toBeInTheDocument();

    const searchProducts = vi.fn<(...arg: unknown[]) => SearchProductsResponse>();
    const getCart = vi.fn().mockReturnValue(buildGetCartWith({ data: { site: { cart: null } } }));

    const variant = buildVariantWith({
      purchasing_disabled: false,
      bc_calculated_price: {
        tax_exclusive: 123,
      },
    });

    when(searchProducts)
      .calledWith(stringContainingAll('search: "Laugh Canister"', 'currencyCode: "USD"'))
      .thenReturn({ data: { productsSearch: [] } });

    when(searchProducts)
      .calledWith(stringContainingAll('search: "Door Station Panel"', 'currencyCode: "USD"'))
      .thenReturn({
        data: {
          productsSearch: [
            buildSearchProductWith({
              id: variant.product_id,
              name: 'Door Station Panel',
              sku: 'DSP-123',
              optionsV3: [],
              isPriceHidden: false,
              variants: [variant],
            }),
          ],
        },
      });

    server.use(
      graphql.query('SearchProducts', ({ query }) => HttpResponse.json(searchProducts(query))),
      graphql.query('getCart', () => HttpResponse.json(getCart())),
    );

    const searchInput = screen.getByPlaceholderText('Search products');

    await userEvent.type(searchInput, 'Laugh Canister');

    await userEvent.click(screen.getByRole('button', { name: 'Search product' }));

    const dialog = await screen.findByRole('dialog', { name: 'Quick order pad' });

    expect(within(dialog).getByText('No products found')).toBeInTheDocument();

    const dialogSearchBox = within(dialog).getByRole('textbox');

    await userEvent.clear(dialogSearchBox);
    await userEvent.type(dialogSearchBox, 'Door Station Panel{enter}');

    const quantityInput = within(dialog).getByRole('spinbutton');

    await userEvent.type(quantityInput, '2', {
      initialSelectionStart: 0,
      initialSelectionEnd: Infinity,
    });

    expect(within(dialog).getByText('Door Station Panel')).toBeInTheDocument();
    expect(within(dialog).getByText('$123.00')).toBeInTheDocument();
    expect(within(dialog).getByText('$246.00')).toBeInTheDocument();
    expect(within(dialog).getByText('DSP-123')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Add to cart' })).toBeInTheDocument();
  });
});

describe('when search returns results', () => {
  it('shows the results in a modal and allows adding to cart', async () => {
    renderWithProviders(<QuickOrderPad />, { preloadedState });

    expect(await screen.findByRole('heading', { name: 'Quick order pad' })).toBeInTheDocument();

    const getCart = vi.fn().mockReturnValue(buildGetCartWith({ data: { site: { cart: null } } }));

    const variant = buildVariantWith({
      purchasing_disabled: false,
      bc_calculated_price: {
        tax_exclusive: 123,
      },
    });

    const searchProducts = vi.fn<(...arg: unknown[]) => SearchProductsResponse>();

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

    const createCartSimple = vi.fn();

    when(createCartSimple)
      .calledWith({
        createCartInput: {
          lineItems: [
            {
              productEntityId: Number(variant.product_id),
              variantEntityId: Number(variant.variant_id),
              quantity: 2,
              selectedOptions: { multipleChoices: [], textFields: [] },
            },
          ],
        },
      })
      .thenDo(() => {
        const cart = buildGetCartWith({
          data: { site: { cart: { entityId: '12345' } } },
        });

        getCart.mockReturnValue(cart);

        return { data: { cart: { createCart: { cart: cart.data.site.cart } } } };
      });

    server.use(
      graphql.query('SearchProducts', ({ query }) => HttpResponse.json(searchProducts(query))),
      graphql.query('getCart', () => HttpResponse.json(getCart())),
      graphql.query('priceProducts', ({ variables }) =>
        HttpResponse.json(getPriceProducts(variables)),
      ),
      graphql.mutation('createCartSimple', ({ variables }) =>
        HttpResponse.json(createCartSimple(variables)),
      ),
    );

    const searchBox = screen.getByPlaceholderText('Search products');
    await userEvent.type(searchBox, 'Laugh Canister');

    await userEvent.click(screen.getByRole('button', { name: 'Search product' }));

    const dialog = await screen.findByRole('dialog', { name: 'Quick order pad' });

    const quantityInput = within(dialog).getByRole('spinbutton');

    await userEvent.type(quantityInput, '2', {
      initialSelectionStart: 0,
      initialSelectionEnd: Infinity,
    });

    expect(within(dialog).queryByText('ready to ship', { exact: false })).not.toBeInTheDocument();
    expect(
      within(dialog).queryByText('will be backordered', { exact: false }),
    ).not.toBeInTheDocument();

    expect(within(dialog).getByText('Laugh Canister')).toBeInTheDocument();
    expect(within(dialog).getByText('$123.00')).toBeInTheDocument();
    expect(within(dialog).getByText('$246.00')).toBeInTheDocument();
    expect(within(dialog).getByText('LC-123')).toBeInTheDocument();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Add to cart' }));

    expect(await screen.findByText('Products were added to cart')).toBeInTheDocument();

    expect(Cookies.get('cartId')).toBe('12345');

    expect(window.b2b.callbacks.dispatchEvent).toHaveBeenCalledWith('on-cart-created', {
      cartId: '12345',
    });
  });
});

describe('when backorder messaging is enabled', () => {
  it('shows backorder prompts and available helper that updates when qty changes', async () => {
    renderWithProviders(<QuickOrderPad />, { preloadedState: backorderPreloadedState });

    const variantSku = 'LC-123';

    const variant = buildVariantWith({
      sku: variantSku,
      purchasing_disabled: false,
      bc_calculated_price: {
        tax_exclusive: 123,
      },
    });

    const searchProducts = vi.fn<(...arg: unknown[]) => SearchProductsResponse>();

    when(searchProducts)
      .calledWith(stringContainingAll('search: "Laugh Canister"', 'currencyCode: "USD"'))
      .thenReturn({
        data: {
          productsSearch: [
            buildSearchProductWith({
              id: variant.product_id,
              name: 'Laugh Canister',
              sku: variantSku,
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

    const variantInfo = buildVariantInfoWith({
      variantSku,
      inventoryTracking: 'variant',
      availableToSell: 4,
      unlimitedBackorder: false,
      totalOnHand: 2,
      backorderMessage: 'Lead time: 2-4 weeks',
    });

    const getVariantInfoBySkus = when(vi.fn())
      .calledWith(expect.stringContaining(`variantSkus: ["${variantSku}"]`))
      .thenReturn(buildVariantInfoResponseWith({ data: { variantSku: [variantInfo] } }));

    server.use(
      graphql.query('SearchProducts', ({ query }) => HttpResponse.json(searchProducts(query))),
      graphql.query('GetVariantInfoBySkus', ({ query }) =>
        HttpResponse.json(getVariantInfoBySkus(query)),
      ),
    );

    const searchBox = screen.getByPlaceholderText('Search products');
    await userEvent.type(searchBox, 'Laugh Canister');
    await userEvent.click(screen.getByRole('button', { name: 'Search product' }));

    const dialog = await screen.findByRole('dialog', { name: 'Quick order pad' });
    const quantityInput = within(dialog).getByRole('spinbutton');

    await userEvent.type(quantityInput, '10', {
      initialSelectionStart: 0,
      initialSelectionEnd: Infinity,
    });

    await waitFor(() => {
      expect(within(dialog).getByText('4 available')).toBeVisible();
    });
    expect(within(dialog).getByText('2 ready to ship')).toBeVisible();
    expect(within(dialog).getByText('2 will be backordered')).toBeVisible();
    expect(within(dialog).getByText('Lead time: 2-4 weeks')).toBeVisible();

    await userEvent.type(quantityInput, '2', {
      initialSelectionStart: 0,
      initialSelectionEnd: Infinity,
    });

    await waitFor(() => {
      expect(within(dialog).queryByText('2 ready to ship')).not.toBeInTheDocument();
    });
    expect(within(dialog).queryByText('2 will be backordered')).not.toBeInTheDocument();
    expect(within(dialog).queryByText('Lead time: 2-4 weeks')).not.toBeInTheDocument();
    expect(within(dialog).queryByText('4 available')).not.toBeInTheDocument();
  });

  it('shows backorder prompts in choose options when a variant is selected', async () => {
    renderWithProviders(<QuickOrderPad />, { preloadedState: backorderPreloadedState });

    const productId = 9001;
    const optionId = 50;
    const sizeM = 102;
    const variantSku = 'TOWEL-M';

    const variantM = buildVariantWith({
      product_id: productId,
      sku: variantSku,
      purchasing_disabled: false,
      option_values: [
        {
          id: sizeM,
          label: 'M',
          option_id: optionId,
          option_display_name: 'Size',
        },
      ],
      available_to_sell: 10,
      unlimited_backorder: false,
      total_on_hand: 2,
      backorder_message: 'Lead time: 2-4 weeks',
      bc_calculated_price: {
        tax_exclusive: 50,
        tax_inclusive: 55,
        as_entered: 50,
        entered_inclusive: false,
      },
    });

    const variantS = buildVariantWith({
      product_id: productId,
      sku: 'TOWEL-S',
      purchasing_disabled: false,
      option_values: [
        {
          id: 101,
          label: 'S',
          option_id: optionId,
          option_display_name: 'Size',
        },
      ],
      available_to_sell: 5,
      unlimited_backorder: false,
      total_on_hand: 5,
      bc_calculated_price: {
        tax_exclusive: 45,
        tax_inclusive: 50,
        as_entered: 45,
        entered_inclusive: false,
      },
    });

    const sizeOption = buildSearchProductV3OptionWith({
      id: optionId,
      product_id: productId,
      type: 'rectangles',
      display_name: 'Size',
      option_values: [
        buildSearchProductV3OptionValueWith({
          id: 101,
          label: 'S',
          is_default: false,
        }),
        buildSearchProductV3OptionValueWith({
          id: sizeM,
          label: 'M',
          is_default: true,
        }),
      ],
    });

    const searchProducts = vi.fn<(...arg: unknown[]) => SearchProductsResponse>();

    when(searchProducts)
      .calledWith(stringContainingAll('search: "Fog Towel"', 'currencyCode: "USD"'))
      .thenReturn({
        data: {
          productsSearch: [
            buildSearchProductWith({
              id: productId,
              name: 'Fog Towel',
              sku: 'TOWEL-BASE',
              inventoryTracking: 'variant',
              optionsV3: [sizeOption],
              isPriceHidden: false,
              orderQuantityMinimum: 0,
              orderQuantityMaximum: 0,
              inventoryLevel: 100,
              variants: [variantS, variantM],
            }),
          ],
        },
      });

    const getPriceProducts = vi.fn<(...arg: unknown[]) => PriceProductsResponse>();

    when(getPriceProducts)
      .calledWith(
        expect.objectContaining({
          items: [
            expect.objectContaining({
              productId,
              variantId: variantM.variant_id,
            }),
          ],
        }),
      )
      .thenReturn({
        data: {
          priceProducts: [
            buildProductPriceWith({
              productId,
              variantId: variantM.variant_id,
            }),
          ],
        },
      });

    server.use(
      graphql.query('SearchProducts', ({ query }) => HttpResponse.json(searchProducts(query))),
      graphql.query('priceProducts', ({ variables }) =>
        HttpResponse.json(getPriceProducts(variables)),
      ),
    );

    const searchBox = screen.getByPlaceholderText('Search products');
    await userEvent.type(searchBox, 'Fog Towel');
    await userEvent.click(screen.getByRole('button', { name: 'Search product' }));

    const listDialog = await screen.findByRole('dialog', { name: 'Quick order pad' });
    await userEvent.click(within(listDialog).getByRole('button', { name: 'Choose options' }));

    const chooseOptionsDialog = await screen.findByRole('dialog', { name: 'Choose options' });
    const quantityInput = within(chooseOptionsDialog).getByRole('spinbutton');

    await waitFor(() => {
      expect(within(chooseOptionsDialog).getByText(variantSku)).toBeInTheDocument();
    });

    await userEvent.type(quantityInput, '4', {
      initialSelectionStart: 0,
      initialSelectionEnd: Infinity,
    });

    await waitFor(() => {
      expect(within(chooseOptionsDialog).getByText('2 ready to ship')).toBeVisible();
    });
    expect(within(chooseOptionsDialog).getByText('2 will be backordered')).toBeVisible();
    expect(within(chooseOptionsDialog).getByText('Lead time: 2-4 weeks')).toBeVisible();

    await userEvent.type(quantityInput, '15', {
      initialSelectionStart: 0,
      initialSelectionEnd: Infinity,
    });

    await waitFor(() => {
      expect(within(chooseOptionsDialog).getByText('10 available')).toBeVisible();
    });
    expect(within(chooseOptionsDialog).getByText('2 ready to ship')).toBeVisible();
    expect(within(chooseOptionsDialog).getByText('8 will be backordered')).toBeVisible();

    await userEvent.type(quantityInput, '2', {
      initialSelectionStart: 0,
      initialSelectionEnd: Infinity,
    });

    await waitFor(() => {
      expect(within(chooseOptionsDialog).queryByText('2 ready to ship')).not.toBeInTheDocument();
    });
    expect(
      within(chooseOptionsDialog).queryByText('2 will be backordered'),
    ).not.toBeInTheDocument();
    expect(within(chooseOptionsDialog).queryByText('Lead time: 2-4 weeks')).not.toBeInTheDocument();
    expect(within(chooseOptionsDialog).queryByText('10 available')).not.toBeInTheDocument();
  });

  it('shows the selected picklist child backorder in choose options', async () => {
    renderWithProviders(<QuickOrderPad />, { preloadedState: backorderPreloadedState });

    const productId = 9100;
    const modifierId = 70;
    const pickOptionId = 300;
    const childProductId = 9200;

    const pickleFestModifier = {
      id: modifierId,
      type: 'product_list',
      display_name: 'PickleFest',
      required: false,
      option_values: [
        {
          id: pickOptionId,
          label: 'Mining Pick',
          is_default: true,
          value_data: { product_id: childProductId },
        },
      ],
    };

    const baseVariant = buildVariantWith({
      product_id: productId,
      sku: 'PK',
      purchasing_disabled: false,
      option_values: [],
      bc_calculated_price: {
        tax_exclusive: 22,
        tax_inclusive: 22,
        as_entered: 22,
        entered_inclusive: false,
      },
    });

    const childProduct = buildSearchProductWith({
      id: childProductId,
      name: 'Mining Pick',
      inventoryTracking: 'product',
      availableToSell: 100,
      unlimitedBackorder: false,
      totalOnHand: 2,
      backorderMessage: 'Lead time: 2-4 weeks',
      variants: [],
    });

    const searchProducts = vi.fn<(...arg: unknown[]) => SearchProductsResponse>();

    when(searchProducts)
      .calledWith(stringContainingAll('search: "Pickle Kit"', 'currencyCode: "USD"'))
      .thenReturn({
        data: {
          productsSearch: [
            buildSearchProductWith({
              id: productId,
              name: 'Pickle Kit',
              sku: 'PK',
              inventoryTracking: 'simple',
              optionsV3: [],
              modifiers: [pickleFestModifier],
              isPriceHidden: false,
              orderQuantityMinimum: 0,
              orderQuantityMaximum: 0,
              inventoryLevel: 100,
              variants: [baseVariant],
            }),
          ],
        },
      });

    when(searchProducts)
      .calledWith(stringContainingAll(`productIds: [${childProductId}]`))
      .thenReturn({ data: { productsSearch: [childProduct] } });

    const getPriceProducts = vi.fn<(...arg: unknown[]) => PriceProductsResponse>().mockReturnValue({
      data: {
        priceProducts: [buildProductPriceWith({ productId, variantId: baseVariant.variant_id })],
      },
    });

    server.use(
      graphql.query('SearchProducts', ({ query }) => HttpResponse.json(searchProducts(query))),
      graphql.query('priceProducts', () => HttpResponse.json(getPriceProducts())),
    );

    const searchBox = screen.getByPlaceholderText('Search products');
    await userEvent.type(searchBox, 'Pickle Kit');
    await userEvent.click(screen.getByRole('button', { name: 'Search product' }));

    const listDialog = await screen.findByRole('dialog', { name: 'Quick order pad' });
    await userEvent.click(within(listDialog).getByRole('button', { name: 'Choose options' }));

    const chooseOptionsDialog = await screen.findByRole('dialog', { name: 'Choose options' });
    const quantityInput = within(chooseOptionsDialog).getByRole('spinbutton');

    await userEvent.type(quantityInput, '4', {
      initialSelectionStart: 0,
      initialSelectionEnd: Infinity,
    });

    await waitFor(() => {
      expect(within(chooseOptionsDialog).getByText('PickleFest:')).toBeVisible();
    });
    expect(within(chooseOptionsDialog).getByText('2 ready to ship')).toBeVisible();
    expect(within(chooseOptionsDialog).getByText('2 will be backordered')).toBeVisible();
    expect(within(chooseOptionsDialog).getByText('Lead time: 2-4 weeks')).toBeVisible();
  });

  it('hides the picklist child backorder when messaging is disabled', async () => {
    renderWithProviders(<QuickOrderPad />, { preloadedState });

    const productId = 9300;
    const modifierId = 71;
    const pickOptionId = 301;
    const childProductId = 9400;

    const pickleFestModifier = {
      id: modifierId,
      type: 'product_list',
      display_name: 'PickleFest',
      required: false,
      option_values: [
        {
          id: pickOptionId,
          label: 'Mining Pick',
          is_default: true,
          value_data: { product_id: childProductId },
        },
      ],
    };

    const baseVariant = buildVariantWith({
      product_id: productId,
      sku: 'PK2',
      purchasing_disabled: false,
      option_values: [],
      bc_calculated_price: {
        tax_exclusive: 22,
        tax_inclusive: 22,
        as_entered: 22,
        entered_inclusive: false,
      },
    });

    const childProduct = buildSearchProductWith({
      id: childProductId,
      name: 'Mining Pick',
      inventoryTracking: 'product',
      availableToSell: 100,
      unlimitedBackorder: false,
      totalOnHand: 2,
      backorderMessage: 'Lead time: 2-4 weeks',
      variants: [],
    });

    const searchProducts = vi.fn<(...arg: unknown[]) => SearchProductsResponse>();

    when(searchProducts)
      .calledWith(stringContainingAll('search: "Pickle Kit"'))
      .thenReturn({
        data: {
          productsSearch: [
            buildSearchProductWith({
              id: productId,
              name: 'Pickle Kit',
              sku: 'PK2',
              inventoryTracking: 'simple',
              optionsV3: [],
              modifiers: [pickleFestModifier],
              isPriceHidden: false,
              orderQuantityMinimum: 0,
              orderQuantityMaximum: 0,
              inventoryLevel: 100,
              variants: [baseVariant],
            }),
          ],
        },
      });

    when(searchProducts)
      .calledWith(stringContainingAll(`productIds: [${childProductId}]`))
      .thenReturn({ data: { productsSearch: [childProduct] } });

    const getPriceProducts = vi.fn<(...arg: unknown[]) => PriceProductsResponse>().mockReturnValue({
      data: {
        priceProducts: [buildProductPriceWith({ productId, variantId: baseVariant.variant_id })],
      },
    });

    server.use(
      graphql.query('SearchProducts', ({ query }) => HttpResponse.json(searchProducts(query))),
      graphql.query('priceProducts', () => HttpResponse.json(getPriceProducts())),
    );

    const searchBox = screen.getByPlaceholderText('Search products');
    await userEvent.type(searchBox, 'Pickle Kit');
    await userEvent.click(screen.getByRole('button', { name: 'Search product' }));

    const listDialog = await screen.findByRole('dialog', { name: 'Quick order pad' });
    await userEvent.click(within(listDialog).getByRole('button', { name: 'Choose options' }));

    const chooseOptionsDialog = await screen.findByRole('dialog', { name: 'Choose options' });
    const quantityInput = within(chooseOptionsDialog).getByRole('spinbutton');

    await userEvent.type(quantityInput, '4', {
      initialSelectionStart: 0,
      initialSelectionEnd: Infinity,
    });

    await waitFor(() => {
      expect(within(chooseOptionsDialog).getByText('PickleFest')).toBeVisible();
    });
    expect(within(chooseOptionsDialog).queryByText('PickleFest:')).not.toBeInTheDocument();
    expect(
      within(chooseOptionsDialog).queryByText('2 will be backordered'),
    ).not.toBeInTheDocument();
    expect(within(chooseOptionsDialog).queryByText('Lead time: 2-4 weeks')).not.toBeInTheDocument();
  });

  it('renders no picklist backorder block when the selected child is in stock', async () => {
    renderWithProviders(<QuickOrderPad />, { preloadedState: backorderPreloadedState });

    const productId = 9500;
    const modifierId = 72;
    const pickOptionId = 302;
    const childProductId = 9600;

    const pickleFestModifier = {
      id: modifierId,
      type: 'product_list',
      display_name: 'PickleFest',
      required: false,
      option_values: [
        {
          id: pickOptionId,
          label: 'Mining Pick',
          is_default: true,
          value_data: { product_id: childProductId },
        },
      ],
    };

    const baseVariant = buildVariantWith({
      product_id: productId,
      sku: 'PK3',
      purchasing_disabled: false,
      option_values: [],
      bc_calculated_price: {
        tax_exclusive: 22,
        tax_inclusive: 22,
        as_entered: 22,
        entered_inclusive: false,
      },
    });

    const childProduct = buildSearchProductWith({
      id: childProductId,
      name: 'Mining Pick',
      inventoryTracking: 'product',
      availableToSell: 100,
      unlimitedBackorder: false,
      totalOnHand: 100,
      backorderMessage: 'Lead time: 2-4 weeks',
      variants: [],
    });

    const searchProducts = vi.fn<(...arg: unknown[]) => SearchProductsResponse>();
    when(searchProducts)
      .calledWith(stringContainingAll('search: "Pickle Kit"'))
      .thenReturn({
        data: {
          productsSearch: [
            buildSearchProductWith({
              id: productId,
              name: 'Pickle Kit',
              sku: 'PK3',
              inventoryTracking: 'simple',
              optionsV3: [],
              modifiers: [pickleFestModifier],
              isPriceHidden: false,
              orderQuantityMinimum: 0,
              orderQuantityMaximum: 0,
              inventoryLevel: 100,
              variants: [baseVariant],
            }),
          ],
        },
      });
    when(searchProducts)
      .calledWith(stringContainingAll(`productIds: [${childProductId}]`))
      .thenReturn({ data: { productsSearch: [childProduct] } });

    const getPriceProducts = vi.fn<(...arg: unknown[]) => PriceProductsResponse>().mockReturnValue({
      data: {
        priceProducts: [buildProductPriceWith({ productId, variantId: baseVariant.variant_id })],
      },
    });

    server.use(
      graphql.query('SearchProducts', ({ query }) => HttpResponse.json(searchProducts(query))),
      graphql.query('priceProducts', () => HttpResponse.json(getPriceProducts())),
    );

    const searchBox = screen.getByPlaceholderText('Search products');
    await userEvent.type(searchBox, 'Pickle Kit');
    await userEvent.click(screen.getByRole('button', { name: 'Search product' }));

    const listDialog = await screen.findByRole('dialog', { name: 'Quick order pad' });
    await userEvent.click(within(listDialog).getByRole('button', { name: 'Choose options' }));

    const chooseOptionsDialog = await screen.findByRole('dialog', { name: 'Choose options' });
    const quantityInput = within(chooseOptionsDialog).getByRole('spinbutton');
    await userEvent.type(quantityInput, '4', {
      initialSelectionStart: 0,
      initialSelectionEnd: Infinity,
    });

    // The picklist modifier label still renders in the options form...
    await waitFor(() => {
      expect(within(chooseOptionsDialog).getByText('PickleFest')).toBeVisible();
    });
    // ...but no backorder block (header or lines) shows for an in-stock child.
    expect(within(chooseOptionsDialog).queryByText('PickleFest:')).not.toBeInTheDocument();
    expect(within(chooseOptionsDialog).queryByText('Lead time: 2-4 weeks')).not.toBeInTheDocument();
    expect(
      within(chooseOptionsDialog).queryByText('ready to ship', { exact: false }),
    ).not.toBeInTheDocument();
    expect(
      within(chooseOptionsDialog).queryByText('will be backordered', { exact: false }),
    ).not.toBeInTheDocument();
  });
});
