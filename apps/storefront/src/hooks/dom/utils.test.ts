import { builder, faker, graphql, HttpResponse, startMockServer } from 'tests/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { when } from 'vitest-when';

import { PriceProductsResponse } from '@/shared/service/b2b/graphql/global';
import {
  SearchProductsResponse,
  ValidateProductResponse,
} from '@/shared/service/b2b/graphql/product';
import { getProductOptionList } from '@/utils/b3AddToShoppingList';
import b2bLogger from '@/utils/b3Logger';
import { addQuoteDraftProduce } from '@/utils/b3Product/b3Product';
import { globalSnackbar } from '@/utils/b3Tip';

import { addProductFromProductPageToQuote } from './utils';

const { server } = startMockServer();

vi.mock('@/utils/b3Tip', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/utils/b3Tip')>();

  return {
    ...original,
    globalSnackbar: {
      error: vi.fn(),
      success: vi.fn(),
      warning: vi.fn(),
    },
  };
});

vi.mock('@/utils/b3AddToShoppingList', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/utils/b3AddToShoppingList')>();

  return {
    ...original,
    getProductOptionList: vi.fn(),
  };
});

vi.mock('@/utils/b3Product/b3Product', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/utils/b3Product/b3Product')>();

  return {
    ...original,
    addQuoteDraftProduce: vi.fn(),
  };
});

vi.mock('@/utils/b3Logger', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/utils/b3Logger')>();

  return {
    ...original,
    default: {
      error: vi.fn(),
    },
  };
});

function createDOM({ productId, qty, sku }: { productId: number; qty: number; sku: string }) {
  document.body.innerHTML = `
    <div class="productView">
      <input name="product_id" value="${productId}" />
      <input name="qty[]" value="${qty}" />
      <span data-product-sku>${sku}</span>
      <form data-cart-item-add></form>
    </div>
  `;

  return document.querySelector('.productView')!;
}

const b3Lang = (key: string, params?: any) => {
  switch (key) {
    case 'quoteDraft.productPageToQuote.outOfStock':
      return `outOfStock:${params?.name}:${params?.qty}`;

    case 'quoteDraft.notification.openQuote':
      return 'openQuote';

    case 'global.notification.addProductSingular':
      return 'addProductSingular';

    case 'global.notification.maximumPurchaseExceed':
      return 'maximumPurchaseExceed';

    case 'quoteDraft.notification.cantAddProductsNoSku':
      return 'cantAddNoSku';

    case 'quoteDraft.productPageToQuote.unavailable':
      return 'unavailable';

    default:
      return key;
  }
};

type PriceProduct = PriceProductsResponse['data']['priceProducts'][number];
type Price = PriceProduct['price'];
type SearchB2BProduct = SearchProductsResponse['data']['productsSearch'][number];
type ProductVariant = SearchB2BProduct['variants'][number];
type ValidateProduct = ValidateProductResponse['data']['validateProduct'];

const buildPriceWith = builder<Price>(() => ({
  asEntered: Number(faker.commerce.price()),
  enteredInclusive: faker.datatype.boolean(),
  taxExclusive: Number(faker.commerce.price()),
  taxInclusive: Number(faker.commerce.price()),
}));

const buildProductPriceWith = builder<PriceProduct>(() => ({
  productId: faker.number.int({ min: 1 }),
  variantId: faker.number.int({ min: 1 }),
  options: [],
  referenceRequest: {
    productId: faker.number.int({ min: 1 }),
    variantId: faker.number.int({ min: 1 }),
    options: null,
  },
  retailPrice: null,
  salePrice: null,
  minimumAdvertisedPrice: null,
  saved: null,
  price: buildPriceWith('WHATEVER_VALUES'),
  calculatedPrice: buildPriceWith('WHATEVER_VALUES'),
  priceRange: {
    minimum: buildPriceWith('WHATEVER_VALUES'),
    maximum: buildPriceWith('WHATEVER_VALUES'),
  },
  retailPriceRange: null,
  bulkPricing: [],
}));

const buildProductVariantWith = builder<ProductVariant>(() => ({
  variant_id: faker.number.int({ min: 1 }),
  product_id: faker.number.int({ min: 1 }),
  sku: faker.number.int().toString(),
  option_values: Array.from({ length: faker.number.int({ min: 0, max: 10 }) }, () => ({
    id: faker.number.int({ min: 1 }),
    label: faker.commerce.productAdjective(),
    option_id: faker.number.int({ min: 1 }),
    option_display_name: faker.commerce.productMaterial(),
  })),
  calculated_price: Number(faker.commerce.price()),
  image_url: faker.image.url(),
  has_price_list: faker.datatype.boolean(),
  bulk_prices: [],
  purchasing_disabled: false,
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

const buildProductModifierWith = builder(() => ({
  id: faker.number.int({ min: 1 }),
  display_name: faker.commerce.productMaterial(),
  type: faker.helpers.arrayElement(['text', 'select', 'checkbox']),
  required: faker.datatype.boolean(),
  config: {
    default_value: faker.commerce.productDescription(),
    text_characters_limited: faker.datatype.boolean(),
    text_min_length: faker.number.int({ min: 0, max: 100 }),
    text_max_length: faker.number.int({ min: 100, max: 500 }),
  },
  option_values: [],
}));

const buildSearchB2BProductWith = builder<SearchB2BProduct>(() => ({
  id: faker.number.int({ min: 1 }),
  name: faker.commerce.productName(),
  sku: faker.number.int().toString(),
  costPrice: faker.commerce.price(),
  inventoryLevel: faker.number.int(),
  inventoryTracking: faker.helpers.arrayElement(['none', 'product', 'variant']),
  availability: faker.helpers.arrayElement(['available', 'disabled']),
  orderQuantityMinimum: faker.number.int(),
  orderQuantityMaximum: faker.number.int(),
  variants: Array.from({ length: faker.number.int({ min: 1, max: 10 }) }, buildProductVariantWith),
  currencyCode: faker.finance.currencyCode(),
  imageUrl: faker.image.url(),
  modifiers: [],
  options: [],
  optionsV3: [],
  channelId: [],
  productUrl: faker.internet.url(),
  taxClassId: faker.number.int({ min: 1 }),
  isPriceHidden: faker.datatype.boolean(),
  availableToSell: faker.number.int(),
  unlimitedBackorder: faker.datatype.boolean(),
}));

const buildValidateProductWith = builder<ValidateProduct>(() =>
  faker.helpers.arrayElement([
    {
      responseType: 'SUCCESS',
      message: faker.lorem.sentence(),
    },
    {
      responseType: 'WARNING',
      message: faker.lorem.sentence(),
    },
    {
      responseType: 'ERROR',
      message: faker.lorem.sentence(),
      errorCode: faker.helpers.arrayElement(['NON_PURCHASABLE', 'OOS', 'INVALID_FIELDS', 'OTHER']),
      product: {
        availableToSell: faker.number.int(),
      },
    },
  ]),
);

const priceProduct = vi.fn<(variables: unknown) => PriceProduct>();
const searchProduct = vi.fn<(query: string) => SearchB2BProduct>();
const setOpenPage = vi.fn();

beforeEach(() => {
  document.body.innerHTML = '';
  vi.clearAllMocks();

  server.use(
    graphql.query('priceProducts', async ({ variables }) =>
      HttpResponse.json({ data: { priceProducts: [priceProduct(variables)] } }),
    ),
    graphql.query('SearchProducts', ({ query }) =>
      HttpResponse.json({
        data: {
          productsSearch: [searchProduct(query)],
        },
      }),
    ),
  );

  vi.mocked(getProductOptionList).mockReturnValue([]);
  vi.mocked(addQuoteDraftProduce).mockResolvedValue(undefined);
});

describe('addProductFromProductPageToQuote', () => {
  it('shows error when SKU is missing from DOM', async () => {
    createDOM({ productId: 123, qty: 1, sku: '' });

    const { addToQuote } = addProductFromProductPageToQuote(setOpenPage, true, b3Lang, {});

    await addToQuote();

    expect(globalSnackbar.error).toHaveBeenCalledWith('cantAddNoSku');
    expect(addQuoteDraftProduce).not.toHaveBeenCalled();
  });

  it('shows error when required options are not filled', async () => {
    createDOM({ productId: 123, qty: 1, sku: 'SKU123' });

    when(searchProduct)
      .calledWith(expect.stringContaining('productIds: [123]'))
      .thenReturn(
        buildSearchB2BProductWith({
          id: 123,
          sku: 'SKU123',
          name: 'Product Name',
          variants: [buildProductVariantWith({ sku: 'SKU123', product_id: 123 })],
          modifiers: [buildProductModifierWith({ type: 'text', required: true })],
        }),
      );

    const { addToQuote } = addProductFromProductPageToQuote(setOpenPage, true, b3Lang, {});

    await addToQuote();

    expect(globalSnackbar.error).toHaveBeenCalledWith('Please fill out product options first.');
    expect(addQuoteDraftProduce).not.toHaveBeenCalled();
  });

  it('shows maximum purchase exceeded error when quantity is too high', async () => {
    createDOM({ productId: 123, qty: 1000001, sku: 'SKU123' });

    when(searchProduct)
      .calledWith(expect.stringContaining('productIds: [123]'))
      .thenReturn(
        buildSearchB2BProductWith({
          id: 123,
          sku: 'SKU123',
          name: 'Product Name',
          variants: [buildProductVariantWith({ sku: 'SKU123', product_id: 123 })],
        }),
      );

    when(priceProduct)
      .calledWith(
        expect.objectContaining({
          items: [expect.objectContaining({ productId: 123 })],
        }),
      )
      .thenReturn(buildProductPriceWith('WHATEVER_VALUES'));

    const { addToQuote } = addProductFromProductPageToQuote(setOpenPage, true, b3Lang, {});

    await addToQuote();

    expect(globalSnackbar.error).toHaveBeenCalledWith('maximumPurchaseExceed', expect.any(Object));
    expect(addQuoteDraftProduce).not.toHaveBeenCalled();
  });

  it('logs error when exception is thrown', async () => {
    server.use(
      graphql.query('SearchProducts', () => HttpResponse.json({ errors: [{ message: 'test' }] })),
    );

    createDOM({ productId: 123, qty: 1, sku: 'SKU123' });

    const { addToQuote } = addProductFromProductPageToQuote(setOpenPage, true, b3Lang, {});

    await addToQuote();

    expect(b2bLogger.error).toHaveBeenCalledWith(new Error('test'));
  });

  describe('when the feature flag is disabled', () => {
    describe('when NP&OOS setting is disabled', () => {
      it('shows error when product is unavailable', async () => {
        createDOM({ productId: 123, qty: 1, sku: 'SKU123' });

        when(searchProduct)
          .calledWith(expect.stringContaining('productIds: [123]'))
          .thenReturn(
            buildSearchB2BProductWith({
              id: 123,
              sku: 'SKU123',
              name: 'Product Name',
              variants: [buildProductVariantWith({ sku: 'SKU123' })],
              availability: 'disabled',
            }),
          );

        const { addToQuote } = addProductFromProductPageToQuote(setOpenPage, false, b3Lang, {});

        await addToQuote();

        expect(globalSnackbar.error).toHaveBeenCalledWith('unavailable');
        expect(addQuoteDraftProduce).not.toHaveBeenCalled();
      });

      describe('product level inventory', () => {
        it('shows error when product is out of stock', async () => {
          createDOM({ productId: 123, qty: 11, sku: 'SKU123' });

          when(searchProduct)
            .calledWith(expect.stringContaining('productIds: [123]'))
            .thenReturn(
              buildSearchB2BProductWith({
                id: 123,
                sku: 'SKU123',
                name: 'Product Name',
                variants: [buildProductVariantWith({ sku: 'SKU123', product_id: 123 })],
                availability: 'available',
                inventoryLevel: 10,
                inventoryTracking: 'product',
              }),
            );

          const { addToQuote } = addProductFromProductPageToQuote(setOpenPage, false, b3Lang, {});

          await addToQuote();

          expect(globalSnackbar.error).toHaveBeenCalledWith('outOfStock:Product Name:10');
          expect(addQuoteDraftProduce).not.toHaveBeenCalled();
        });

        it('adds product successfully when product is in stock', async () => {
          createDOM({ productId: 123, qty: 1, sku: 'SKU123' });

          when(searchProduct)
            .calledWith(expect.stringContaining('productIds: [123]'))
            .thenReturn(
              buildSearchB2BProductWith({
                id: 123,
                sku: 'SKU123',
                name: 'Product Name',
                variants: [buildProductVariantWith({ sku: 'SKU123', product_id: 123 })],
                availability: 'available',
                inventoryLevel: 10,
                inventoryTracking: 'product',
              }),
            );

          when(priceProduct)
            .calledWith(
              expect.objectContaining({
                items: [expect.objectContaining({ productId: 123 })],
              }),
            )
            .thenReturn(buildProductPriceWith('WHATEVER_VALUES'));

          const { addToQuote } = addProductFromProductPageToQuote(setOpenPage, false, b3Lang, {});

          await addToQuote();

          expect(globalSnackbar.success).toHaveBeenCalled();
          expect(addQuoteDraftProduce).toHaveBeenCalled();
        });
      });

      describe('variant level inventory', () => {
        it('shows error when variant is out of stock', async () => {
          createDOM({ productId: 123, qty: 11, sku: 'SKU123' });

          when(searchProduct)
            .calledWith(expect.stringContaining('productIds: [123]'))
            .thenReturn(
              buildSearchB2BProductWith({
                id: 123,
                sku: 'SKU123',
                name: 'Product Name',
                variants: [
                  buildProductVariantWith({ sku: 'SKU123', product_id: 123, inventory_level: 10 }),
                ],
                availability: 'available',
                inventoryTracking: 'variant',
              }),
            );

          const { addToQuote } = addProductFromProductPageToQuote(setOpenPage, false, b3Lang, {});

          await addToQuote();

          expect(globalSnackbar.error).toHaveBeenCalledWith('outOfStock:Product Name:10');
          expect(addQuoteDraftProduce).not.toHaveBeenCalled();
        });

        it('adds product successfully when variant is in stock', async () => {
          createDOM({ productId: 123, qty: 1, sku: 'SKU123' });

          when(searchProduct)
            .calledWith(expect.stringContaining('productIds: [123]'))
            .thenReturn(
              buildSearchB2BProductWith({
                id: 123,
                sku: 'SKU123',
                name: 'Product Name',
                variants: [
                  buildProductVariantWith({ sku: 'SKU123', product_id: 123, inventory_level: 10 }),
                ],
                availability: 'available',
                inventoryTracking: 'variant',
              }),
            );

          when(priceProduct)
            .calledWith(
              expect.objectContaining({
                items: [expect.objectContaining({ productId: 123 })],
              }),
            )
            .thenReturn(buildProductPriceWith('WHATEVER_VALUES'));

          const { addToQuote } = addProductFromProductPageToQuote(setOpenPage, false, b3Lang, {});

          await addToQuote();

          expect(globalSnackbar.success).toHaveBeenCalled();
          expect(addQuoteDraftProduce).toHaveBeenCalled();
        });
      });
    });

    describe('when NP&OOS setting is enabled', () => {
      it('adds product successfully when product is unavailable', async () => {
        createDOM({ productId: 123, qty: 1, sku: 'SKU123' });

        when(searchProduct)
          .calledWith(expect.stringContaining('productIds: [123]'))
          .thenReturn(
            buildSearchB2BProductWith({
              id: 123,
              sku: 'SKU123',
              name: 'Product Name',
              variants: [buildProductVariantWith({ sku: 'SKU123', product_id: 123 })],
              availability: 'disabled',
            }),
          );

        when(priceProduct)
          .calledWith(
            expect.objectContaining({
              items: [expect.objectContaining({ productId: 123 })],
            }),
          )
          .thenReturn(buildProductPriceWith('WHATEVER_VALUES'));

        const { addToQuote } = addProductFromProductPageToQuote(setOpenPage, true, b3Lang, {});

        await addToQuote();

        expect(globalSnackbar.success).toHaveBeenCalled();
        expect(addQuoteDraftProduce).toHaveBeenCalled();
      });

      describe('product level inventory', () => {
        it('adds product successfully when product is out of stock', async () => {
          createDOM({ productId: 123, qty: 11, sku: 'SKU123' });

          when(searchProduct)
            .calledWith(expect.stringContaining('productIds: [123]'))
            .thenReturn(
              buildSearchB2BProductWith({
                id: 123,
                sku: 'SKU123',
                name: 'Product Name',
                variants: [buildProductVariantWith({ sku: 'SKU123', product_id: 123 })],
                availability: 'available',
                inventoryLevel: 10,
                inventoryTracking: 'product',
              }),
            );

          when(priceProduct)
            .calledWith(
              expect.objectContaining({
                items: [expect.objectContaining({ productId: 123 })],
              }),
            )
            .thenReturn(buildProductPriceWith('WHATEVER_VALUES'));

          const { addToQuote } = addProductFromProductPageToQuote(setOpenPage, true, b3Lang, {});

          await addToQuote();

          expect(addQuoteDraftProduce).toHaveBeenCalled();
          expect(globalSnackbar.success).toHaveBeenCalled();
        });

        it('adds product successfully when product is in stock', async () => {
          createDOM({ productId: 123, qty: 1, sku: 'SKU123' });

          when(searchProduct)
            .calledWith(expect.stringContaining('productIds: [123]'))
            .thenReturn(
              buildSearchB2BProductWith({
                id: 123,
                sku: 'SKU123',
                name: 'Product Name',
                variants: [buildProductVariantWith({ sku: 'SKU123', product_id: 123 })],
                availability: 'available',
                inventoryLevel: 10,
                inventoryTracking: 'product',
              }),
            );

          when(priceProduct)
            .calledWith(
              expect.objectContaining({
                items: [expect.objectContaining({ productId: 123 })],
              }),
            )
            .thenReturn(buildProductPriceWith('WHATEVER_VALUES'));

          const { addToQuote } = addProductFromProductPageToQuote(setOpenPage, true, b3Lang, {});

          await addToQuote();

          expect(addQuoteDraftProduce).toHaveBeenCalled();
          expect(globalSnackbar.success).toHaveBeenCalled();
        });
      });

      describe('variant level inventory', () => {
        it('adds product successfully when variant is out of stock', async () => {
          createDOM({ productId: 123, qty: 11, sku: 'SKU123' });

          when(searchProduct)
            .calledWith(expect.stringContaining('productIds: [123]'))
            .thenReturn(
              buildSearchB2BProductWith({
                id: 123,
                sku: 'SKU123',
                name: 'Product Name',
                variants: [
                  buildProductVariantWith({ sku: 'SKU123', product_id: 123, inventory_level: 10 }),
                ],
                availability: 'available',
                inventoryTracking: 'variant',
              }),
            );

          when(priceProduct)
            .calledWith(
              expect.objectContaining({
                items: [expect.objectContaining({ productId: 123 })],
              }),
            )
            .thenReturn(buildProductPriceWith('WHATEVER_VALUES'));

          const { addToQuote } = addProductFromProductPageToQuote(setOpenPage, true, b3Lang, {});

          await addToQuote();

          expect(addQuoteDraftProduce).toHaveBeenCalled();
          expect(globalSnackbar.success).toHaveBeenCalled();
        });

        it('adds product successfully when variant is in stock', async () => {
          createDOM({ productId: 123, qty: 1, sku: 'SKU123' });

          when(searchProduct)
            .calledWith(expect.stringContaining('productIds: [123]'))
            .thenReturn(
              buildSearchB2BProductWith({
                id: 123,
                sku: 'SKU123',
                name: 'Product Name',
                variants: [
                  buildProductVariantWith({ sku: 'SKU123', product_id: 123, inventory_level: 10 }),
                ],
                availability: 'available',
                inventoryTracking: 'variant',
              }),
            );

          when(priceProduct)
            .calledWith(
              expect.objectContaining({
                items: [expect.objectContaining({ productId: 123 })],
              }),
            )
            .thenReturn(buildProductPriceWith('WHATEVER_VALUES'));

          const { addToQuote } = addProductFromProductPageToQuote(setOpenPage, true, b3Lang, {});

          await addToQuote();

          expect(addQuoteDraftProduce).toHaveBeenCalled();
          expect(globalSnackbar.success).toHaveBeenCalled();
        });
      });
    });
  });

  describe('when the feature flag is enabled', () => {
    const featureFlags = {
      'B2B-3318.move_stock_and_backorder_validation_to_backend': true,
    };

    const validateProduct = vi.fn();

    beforeEach(() => {
      server.use(
        graphql.query('ValidateProduct', ({ variables }) =>
          HttpResponse.json({
            data: { validateProduct: validateProduct(variables) },
          }),
        ),
      );
    });

    it('shows error when validateProduct returns an error', async () => {
      createDOM({ productId: 123, qty: 1, sku: 'SKU123' });

      when(searchProduct)
        .calledWith(expect.stringContaining('productIds: [123]'))
        .thenReturn(
          buildSearchB2BProductWith({
            id: 123,
            sku: 'SKU123',
            name: 'Product Name',
            variants: [buildProductVariantWith({ variant_id: 1, sku: 'SKU123', product_id: 123 })],
          }),
        );

      when(priceProduct)
        .calledWith(
          expect.objectContaining({
            items: [expect.objectContaining({ productId: 123 })],
          }),
        )
        .thenReturn(buildProductPriceWith('WHATEVER_VALUES'));

      when(validateProduct)
        .calledWith(
          expect.objectContaining({
            productId: 123,
            variantId: 1,
            quantity: 1,
            productOptions: [],
          }),
        )
        .thenReturn(buildValidateProductWith({ responseType: 'ERROR', message: 'test' }));

      const { addToQuote } = addProductFromProductPageToQuote(
        setOpenPage,
        false,
        b3Lang,
        featureFlags,
      );

      await addToQuote();

      expect(globalSnackbar.error).toHaveBeenCalledWith('test');
      expect(addQuoteDraftProduce).not.toHaveBeenCalled();
    });

    it('adds product successfully when validateProduct returns a warning', async () => {
      createDOM({ productId: 123, qty: 1, sku: 'SKU123' });

      when(searchProduct)
        .calledWith(expect.stringContaining('productIds: [123]'))
        .thenReturn(
          buildSearchB2BProductWith({
            id: 123,
            sku: 'SKU123',
            name: 'Product Name',
            variants: [buildProductVariantWith({ variant_id: 1, sku: 'SKU123', product_id: 123 })],
          }),
        );

      when(priceProduct)
        .calledWith(
          expect.objectContaining({
            items: [expect.objectContaining({ productId: 123 })],
          }),
        )
        .thenReturn(buildProductPriceWith('WHATEVER_VALUES'));

      when(validateProduct)
        .calledWith(
          expect.objectContaining({
            productId: 123,
            variantId: 1,
            quantity: 1,
            productOptions: [],
          }),
        )
        .thenReturn(buildValidateProductWith({ responseType: 'WARNING', message: 'test' }));

      const { addToQuote } = addProductFromProductPageToQuote(
        setOpenPage,
        false,
        b3Lang,
        featureFlags,
      );

      await addToQuote();

      expect(addQuoteDraftProduce).toHaveBeenCalled();
    });

    it('adds product successfully when validateProduct returns a success', async () => {
      createDOM({ productId: 123, qty: 1, sku: 'SKU123' });

      when(searchProduct)
        .calledWith(expect.stringContaining('productIds: [123]'))
        .thenReturn(
          buildSearchB2BProductWith({
            id: 123,
            sku: 'SKU123',
            name: 'Product Name',
            variants: [buildProductVariantWith({ variant_id: 1, sku: 'SKU123', product_id: 123 })],
          }),
        );

      when(priceProduct)
        .calledWith(
          expect.objectContaining({
            items: [expect.objectContaining({ productId: 123 })],
          }),
        )
        .thenReturn(buildProductPriceWith('WHATEVER_VALUES'));

      when(validateProduct)
        .calledWith(
          expect.objectContaining({
            productId: 123,
            variantId: 1,
            quantity: 1,
            productOptions: [],
          }),
        )
        .thenReturn(buildValidateProductWith({ responseType: 'SUCCESS', message: '' }));

      const { addToQuote } = addProductFromProductPageToQuote(
        setOpenPage,
        false,
        b3Lang,
        featureFlags,
      );

      await addToQuote();

      expect(globalSnackbar.success).toHaveBeenCalled();
      expect(addQuoteDraftProduce).toHaveBeenCalled();
    });

    it('correctly retrieves the SKU of a product with special characters and adds it to cart', async () => {
      createDOM({ productId: 123, qty: 1, sku: 'A&B' });

      when(searchProduct)
        .calledWith(expect.stringContaining('productIds: [123]'))
        .thenReturn(
          buildSearchB2BProductWith({
            id: 123,
            sku: 'A&B',
            name: 'Product Name',
            variants: [buildProductVariantWith({ variant_id: 1, sku: 'A&B', product_id: 123 })],
          }),
        );

      when(priceProduct)
        .calledWith(
          expect.objectContaining({
            items: [expect.objectContaining({ productId: 123 })],
          }),
        )
        .thenReturn(buildProductPriceWith('WHATEVER_VALUES'));

      when(validateProduct)
        .calledWith(
          expect.objectContaining({
            productId: 123,
            variantId: 1,
            quantity: 1,
            productOptions: [],
          }),
        )
        .thenReturn(buildValidateProductWith({ responseType: 'SUCCESS', message: '' }));

      const { addToQuote } = addProductFromProductPageToQuote(setOpenPage, false, b3Lang, {
        ...featureFlags,
        'B2B-3474.get_sku_from_pdp_with_text_content': true,
      });

      await addToQuote();

      expect(globalSnackbar.success).toHaveBeenCalledWith('addProductSingular', {
        action: {
          onClick: expect.any(Function),
          label: 'openQuote',
        },
      });
    });
  });
});
