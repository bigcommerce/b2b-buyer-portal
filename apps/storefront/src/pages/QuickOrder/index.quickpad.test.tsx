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
  stringContainingAll,
  userEvent,
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
