import { PersistPartial } from 'redux-persist/es/persistReducer';
import { buildGlobalStateWith } from 'tests/test-utils';
import { describe, expect, it, vi } from 'vitest';

import type { RootState } from '@/store';
import * as storeModule from '@/store';
import { QuoteInfoState } from '@/store/slices/quoteInfo';

import { addPrice } from './config';

type QuoteItem = QuoteInfoState['draftQuoteList'][number];

const emptyDraftQuoteInfo: QuoteInfoState['draftQuoteInfo'] = {
  userId: 0,
  contactInfo: {
    name: '',
    email: '',
    companyName: '',
    phoneNumber: '',
    quoteTitle: '',
  },
  shippingAddress: {
    address: '',
    addressId: 0,
    apartment: '',
    companyName: '',
    city: '',
    country: '',
    firstName: '',
    label: '',
    lastName: '',
    phoneNumber: '',
    state: '',
    zipCode: '',
  },
  billingAddress: {
    address: '',
    addressId: 0,
    apartment: '',
    companyName: '',
    city: '',
    country: '',
    firstName: '',
    label: '',
    lastName: '',
    phoneNumber: '',
    state: '',
    zipCode: '',
  },
  fileInfo: [],
  note: '',
  referenceNumber: '',
  extraFields: [],
  recipients: [],
};

const buildQuoteInfoWithList = (draftQuoteList: QuoteItem[]): QuoteInfoState & PersistPartial => ({
  draftQuoteList,
  draftQuoteInfo: emptyDraftQuoteInfo,
  quoteDetailToCheckoutUrl: '',
  _persist: { version: 1, rehydrated: true },
});

const buildProductSearchWith = (
  overrides: Partial<QuoteItem['node']['productsSearch']> = {},
): QuoteItem['node']['productsSearch'] =>
  ({
    inventoryTracking: 'product',
    availability: 'available',
    inventoryLevel: 10,
    availableToSell: 10,
    unlimitedBackorder: false,
    variants: [
      {
        sku: 'test-sku',
        variant_id: 1,
        product_id: 1,
        price: 100,
        option_values: [],
        calculated_price: 100,
        image_url: '',
        has_price_list: false,
        bc_calculated_price: {
          tax_inclusive: 100,
          tax_exclusive: 100,
          entered_inclusive: false,
          as_entered: 100,
        },
        purchasing_disabled: false,
        inventory_level: 10,
        available_to_sell: 10,
        unlimited_backorder: false,
      },
    ],
    ...overrides,
  }) as unknown as QuoteItem['node']['productsSearch'];

const buildDraftQuoteItemWith = ({
  quantity = 1,
  productsSearch,
}: {
  quantity?: number;
  productsSearch?: QuoteItem['node']['productsSearch'];
} = {}): QuoteItem =>
  ({
    node: {
      id: 'item-1',
      basePrice: 100,
      taxPrice: 0,
      quantity,
      optionList: '[]',
      calculatedValue: {},
      variantSku: 'test-sku',
      productsSearch: productsSearch || buildProductSearchWith(),
    },
  }) as QuoteItem;

const setStoreState = (
  draftQuoteList: QuoteItem[],
  { backorderEnabled = false }: { backorderEnabled?: boolean } = {},
) => {
  const preloadedState: Partial<RootState> = {
    global: buildGlobalStateWith({
      showInclusiveTaxPrice: false,
      backorderEnabled,
      blockPendingQuoteNonPurchasableOOS: {
        isEnableProduct: true,
        isEnableRequest: false,
      },
    }),
    quoteInfo: buildQuoteInfoWithList(draftQuoteList),
  };

  const mockedStore = storeModule.setupStore(preloadedState);

  vi.spyOn(storeModule, 'store', 'get').mockReturnValue(mockedStore);
};

describe('addPrice totalIsTbd', () => {
  it('sets totalIsTbd to true when at least one product is out of stock', () => {
    const oosProduct = buildDraftQuoteItemWith({
      quantity: 20,
      productsSearch: buildProductSearchWith({
        inventoryTracking: 'product',
        availability: 'available',
        inventoryLevel: 5,
      }),
    });

    setStoreState([oosProduct]);

    expect(addPrice().totalIsTbd).toBe(true);
  });

  it('sets totalIsTbd to true when at least one product is non-purchasable', () => {
    const nonPurchasableProduct = buildDraftQuoteItemWith({
      productsSearch: buildProductSearchWith({
        availability: 'disabled',
      }),
    });

    setStoreState([nonPurchasableProduct]);

    expect(addPrice().totalIsTbd).toBe(true);
  });

  it('sets totalIsTbd to true when a product quantity exceeds available to sell and backorders are enabled', () => {
    const backorderedOosProduct = buildDraftQuoteItemWith({
      quantity: 15,
      productsSearch: buildProductSearchWith({
        inventoryTracking: 'product',
        availability: 'available',
        availableToSell: 5,
        unlimitedBackorder: false,
        variants: [
          {
            sku: 'test-sku',
            variant_id: 1,
            product_id: 1,
            price: 100,
            option_values: [],
            calculated_price: 100,
            image_url: '',
            has_price_list: false,
            bc_calculated_price: {
              tax_inclusive: 100,
              tax_exclusive: 100,
              entered_inclusive: false,
              as_entered: 100,
            },
            purchasing_disabled: false,
            inventory_level: 5,
            available_to_sell: 5,
            unlimited_backorder: false,
          },
        ],
      }),
    });

    setStoreState([backorderedOosProduct], { backorderEnabled: true });

    expect(addPrice().totalIsTbd).toBe(true);
  });

  it('sets totalIsTbd to false when all products are purchasable and in stock', () => {
    const inStockProduct = buildDraftQuoteItemWith({
      quantity: 2,
      productsSearch: buildProductSearchWith({
        availability: 'available',
        inventoryTracking: 'product',
        inventoryLevel: 10,
      }),
    });

    setStoreState([inStockProduct]);

    expect(addPrice().totalIsTbd).toBe(false);
  });
});
