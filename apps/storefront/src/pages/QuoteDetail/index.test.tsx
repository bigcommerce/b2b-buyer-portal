import { useParams } from 'react-router-dom';
import { graphql, HttpResponse } from 'msw';
import {
  buildCompanyStateWith,
  builder,
  buildStoreInfoStateWith,
  faker,
  getUnixTime,
  renderWithProviders,
  screen,
  startMockServer,
  within,
} from 'tests/test-utils';

import { B2BProducts } from '@/shared/service/b2b/graphql/product';
import { B2BQuoteDetail, QuoteExtraFieldsConfig } from '@/shared/service/b2b/graphql/quote';
import { CompanyStatus, UserTypes } from '@/types';

import QuoteDetail from './index';

vitest.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router-dom')>()),
  useParams: vitest.fn(),
}));

const { server } = startMockServer();

type QuoteProduct = B2BQuoteDetail['data']['quote']['productsList'][number];

const buildQuoteProductWith = builder<QuoteProduct>(() => ({
  productId: faker.number.int().toString(),
  sku: faker.string.uuid(),
  basePrice: faker.commerce.price(),
  discount: faker.commerce.price(),
  offeredPrice: faker.commerce.price(),
  quantity: faker.number.int(),
  variantId: faker.number.int(),
  imageUrl: faker.image.url(),
  orderQuantityMaximum: faker.number.int(),
  orderQuantityMinimum: faker.number.int(),
  productName: faker.commerce.productName(),
  purchaseHandled: faker.datatype.boolean(),
  options: Array.from({ length: faker.number.int({ min: 0, max: 10 }) }, () => ({
    type: faker.lorem.word(),
    optionId: faker.number.int(),
    optionName: faker.lorem.word(),
    optionLabel: faker.commerce.productMaterial(),
    optionValue: faker.lorem.word(),
  })),
  notes: faker.lorem.sentence(),
  costPrice: faker.commerce.price(),
  inventoryTracking: faker.lorem.word(),
  inventoryLevel: faker.number.int(),
}));

type Address =
  | B2BQuoteDetail['data']['quote']['billingAddress']
  | B2BQuoteDetail['data']['quote']['shippingAddress'];

const buildAddressWith = builder<Address>(() => ({
  city: faker.location.city(),
  label: faker.lorem.word(),
  state: faker.location.state(),
  address: faker.location.streetAddress(),
  country: faker.location.country(),
  zipCode: faker.location.zipCode(),
  lastName: faker.person.lastName(),
  addressId: faker.number.int().toString(),
  apartment: faker.location.secondaryAddress(),
  firstName: faker.person.firstName(),
  phoneNumber: faker.phone.number(),
  addressLabel: faker.lorem.word(),
}));

const buildQuoteWith = builder<B2BQuoteDetail>(() => ({
  data: {
    quote: {
      id: faker.string.uuid(),
      createdAt: getUnixTime(faker.date.past().getTime()),
      updatedAt: getUnixTime(faker.date.recent().getTime()),
      quoteNumber: faker.string.uuid(),
      quoteTitle: faker.lorem.words(),
      referenceNumber: faker.string.uuid(),
      userEmail: faker.internet.email(),
      bcCustomerId: faker.number.int(),
      createdBy: faker.person.fullName(),
      expiredAt: getUnixTime(faker.date.future().getTime()),
      companyId: {
        id: faker.string.uuid(),
        companyName: faker.company.name(),
        bcGroupName: faker.company.buzzPhrase(),
        description: faker.lorem.sentence(),
        catalogId: null,
        companyStatus: faker.number.int(),
        addressLine1: faker.location.streetAddress(),
        addressLine2: faker.location.secondaryAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        zipCode: faker.location.zipCode(),
        country: faker.location.country(),
        extraFields: [],
      },
      salesRepStatus: faker.number.int(),
      customerStatus: faker.number.int(),
      subtotal: faker.commerce.price(),
      discount: faker.commerce.price(),
      grandTotal: faker.commerce.price(),
      cartId: faker.string.uuid(),
      cartUrl: faker.internet.url(),
      checkoutUrl: faker.internet.url(),
      bcOrderId: faker.string.uuid(),
      currency: {
        token: faker.finance.currencySymbol(),
        location: faker.location.country(),
        currencyCode: faker.finance.currencyCode(),
        decimalToken: '.',
        decimalPlaces: faker.number.int({ min: 0, max: 100 }),
        thousandsToken: ',',
        currencyExchangeRate: faker.finance.amount(),
      },
      contactInfo: {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        companyName: faker.company.name(),
        phoneNumber: faker.phone.number(),
      },
      trackingHistory: Array.from({ length: faker.number.int({ min: 0, max: 10 }) }, () => ({
        date: getUnixTime(faker.date.recent().getTime()),
        read: faker.datatype.boolean(),
        role: faker.person.jobTitle(),
        message: faker.lorem.sentence(),
      })),
      extraFields: [],
      notes: faker.lorem.paragraph(),
      legalTerms: faker.lorem.paragraph(),
      shippingTotal: faker.commerce.price(),
      taxTotal: faker.commerce.price(),
      totalAmount: faker.commerce.price(),
      shippingMethod: {
        id: faker.number.int().toString(),
        cost: parseFloat(faker.commerce.price()),
        type: faker.lorem.word(),
        imageUrl: faker.image.url(),
        description: faker.lorem.sentence(),
        transitTime: faker.lorem.words(),
        additionalDescription: faker.lorem.sentence(),
      },
      billingAddress: buildAddressWith('WHATEVER_VALUES'),
      oldSalesRepStatus: null,
      oldCustomerStatus: null,
      recipients: [],
      discountType: faker.number.int(),
      discountValue: faker.commerce.price(),
      status: faker.number.int(),
      company: faker.company.name(),
      salesRep: faker.person.fullName(),
      salesRepEmail: faker.internet.email(),
      orderId: faker.number.int().toString(),
      shippingAddress: buildAddressWith('WHATEVER_VALUES'),
      productsList: Array.from({ length: faker.number.int({ min: 1, max: 10 }) }, () =>
        buildQuoteProductWith('WHATEVER_VALUES'),
      ),
      storefrontAttachFiles: [],
      backendAttachFiles: [],
      storeInfo: {
        storeName: faker.company.name(),
        storeAddress: faker.location.streetAddress(),
        storeCountry: faker.location.country(),
        storeLogo: faker.image.url(),
        storeUrl: faker.internet.url(),
      },
      companyInfo: {
        companyId: faker.number.int().toString(),
        companyName: faker.company.name(),
        companyAddress: faker.location.streetAddress(),
        companyCountry: faker.location.country(),
        companyState: faker.location.state(),
        companyCity: faker.location.city(),
        companyZipCode: faker.location.zipCode(),
        phoneNumber: faker.phone.number(),
      },
      salesRepInfo: {
        salesRepName: faker.person.fullName(),
        salesRepEmail: faker.internet.email(),
        salesRepPhoneNumber: faker.phone.number(),
      },
      quoteLogo: faker.image.url(),
      quoteUrl: faker.internet.url(),
      channelId: faker.number.int(),
      channelName: faker.company.name(),
      allowCheckout: faker.datatype.boolean(),
      displayDiscount: faker.datatype.boolean(),
    },
  },
}));

const buildProductSearchWith = builder<B2BProducts>(() => ({
  data: {
    productsSearch: Array.from({ length: faker.number.int({ min: 0, max: 10 }) }, () => ({
      id: faker.number.int(),
      name: faker.commerce.productName(),
      sku: faker.string.uuid(),
      costPrice: faker.commerce.price(),
      inventoryLevel: faker.number.int(),
      inventoryTracking: faker.helpers.arrayElement(['none', 'simple', 'complex']),
      availability: faker.helpers.arrayElement(['available', 'unavailable']),
      orderQuantityMinimum: faker.number.int(),
      orderQuantityMaximum: faker.number.int(),
      variants: Array.from({ length: faker.number.int({ min: 0, max: 10 }) }, () => ({
        variant_id: faker.number.int(),
        product_id: faker.number.int(),
        sku: faker.string.uuid(),
        option_values: Array.from({ length: faker.number.int({ min: 0, max: 10 }) }, () => ({
          id: faker.number.int(),
          label: faker.commerce.productAdjective(),
          option_id: faker.number.int(),
          option_display_name: faker.commerce.productAdjective(),
        })),
        calculated_price: parseFloat(faker.commerce.price()),
        image_url: faker.image.url(),
        has_price_list: faker.datatype.boolean(),
        bulk_prices: [],
        purchasing_disabled: faker.datatype.boolean(),
        cost_price: parseFloat(faker.commerce.price()),
        inventory_level: faker.number.int(),
        bc_calculated_price: {
          as_entered: parseFloat(faker.commerce.price()),
          tax_inclusive: parseFloat(faker.commerce.price()),
          tax_exclusive: parseFloat(faker.commerce.price()),
          entered_inclusive: faker.datatype.boolean(),
        },
      })),
      currencyCode: faker.finance.currencyCode(),
      imageUrl: faker.image.url(),
      modifiers: [],
      options: Array.from({ length: faker.number.int({ min: 0, max: 10 }) }, () => ({
        option_id: faker.number.int(),
        display_name: faker.commerce.productAdjective(),
        sort_order: faker.number.int(),
        is_required: faker.datatype.boolean(),
      })),
      optionsV3: Array.from({ length: faker.number.int({ min: 0, max: 10 }) }, () => ({
        id: faker.number.int(),
        product_id: faker.number.int(),
        name: faker.commerce.productAdjective(),
        display_name: faker.commerce.productAdjective(),
        type: faker.helpers.arrayElement(['rectangles', 'swatch', 'dropdown']),
        sort_order: faker.number.int(),
        option_values: Array.from({ length: faker.number.int({ min: 0, max: 10 }) }, () => ({
          id: faker.number.int(),
          label: faker.commerce.productAdjective(),
          sort_order: faker.number.int(),
          value_data: null,
          is_default: faker.datatype.boolean(),
        })),
        config: [],
      })),
      channelId: [],
      productUrl: faker.internet.url(),
      taxClassId: faker.number.int(),
      isPriceHidden: faker.datatype.boolean(),
    })),
  },
}));

const buildQuoteExtraFieldsWith = builder<QuoteExtraFieldsConfig>(() => ({
  data: { quoteExtraFieldsConfig: [] },
}));

describe('when the user is a B2B customer', () => {
  const approvedB2BCompany = buildCompanyStateWith({
    companyInfo: { status: CompanyStatus.APPROVED },
    customer: { userType: UserTypes.MULTIPLE_B2C },
  });

  const storeInfoWithDateFormat = buildStoreInfoStateWith({ timeFormat: { display: 'j F Y' } });

  const preloadedState = { company: approvedB2BCompany, storeInfo: storeInfoWithDateFormat };

  it('displays the quote number as the page "title"', async () => {
    const quote = buildQuoteWith({ data: { quote: { id: '272989', quoteNumber: '911911' } } });

    server.use(
      graphql.query('GetQuoteInfoB2B', () => HttpResponse.json(quote)),
      graphql.query('SearchProducts', () =>
        HttpResponse.json(buildProductSearchWith('WHATEVER_VALUES')),
      ),
      graphql.query('getQuoteExtraFields', () =>
        HttpResponse.json(buildQuoteExtraFieldsWith('WHATEVER_VALUES')),
      ),
    );

    vitest.mocked(useParams).mockReturnValue({ id: '272989' });

    renderWithProviders(<QuoteDetail />, { preloadedState });

    expect(await screen.findByText('Quote #911911')).toBeInTheDocument();
  });

  it('displays the quote status, issue and expiration dates', async () => {
    const quote = buildQuoteWith({
      data: {
        quote: {
          id: '272989',
          status: 4,
          createdAt: getUnixTime(new Date('2 February 2025')),
          expiredAt: getUnixTime(new Date('3 March 2025')),
        },
      },
    });

    server.use(
      graphql.query('GetQuoteInfoB2B', () => HttpResponse.json(quote)),
      graphql.query('SearchProducts', () =>
        HttpResponse.json(buildProductSearchWith('WHATEVER_VALUES')),
      ),
      graphql.query('getQuoteExtraFields', () =>
        HttpResponse.json(buildQuoteExtraFieldsWith('WHATEVER_VALUES')),
      ),
    );

    vitest.mocked(useParams).mockReturnValue({ id: '272989' });

    renderWithProviders(<QuoteDetail />, { preloadedState });

    expect(await screen.findByText('Ordered')).toBeInTheDocument();

    expect(screen.getByRole('heading', { name: 'Issued on:' })).toBeInTheDocument();
    expect(screen.getByText('2 February 2025')).toBeInTheDocument();

    expect(screen.getByRole('heading', { name: 'Expiration date:' })).toBeInTheDocument();
    expect(screen.getByText('3 March 2025')).toBeInTheDocument();
  });

  it('displays a summary of the products within the quote', async () => {
    const woolSock = buildQuoteProductWith({
      productName: 'Wool Socks',
      quantity: 10,
      basePrice: '49.00',
      offeredPrice: '49.00',
    });

    const denimJacket = buildQuoteProductWith({
      productName: 'Denim Jacket',
      quantity: 3,
      basePrice: '133.33',
      offeredPrice: '133.33',
    });

    const quote = buildQuoteWith({
      data: {
        quote: {
          id: '272989',
          productsList: [woolSock, denimJacket],
          currency: { token: '$', location: 'left', decimalToken: '.', decimalPlaces: 2 },
        },
      },
    });

    server.use(
      graphql.query('GetQuoteInfoB2B', () => HttpResponse.json(quote)),
      graphql.query('SearchProducts', () =>
        HttpResponse.json(buildProductSearchWith('WHATEVER_VALUES')),
      ),
      graphql.query('getQuoteExtraFields', () =>
        HttpResponse.json(buildQuoteExtraFieldsWith('WHATEVER_VALUES')),
      ),
    );

    vitest.mocked(useParams).mockReturnValue({ id: '272989' });

    renderWithProviders(<QuoteDetail />, { preloadedState });

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
    const quote = buildQuoteWith({
      data: {
        quote: {
          id: '272989',
          productsList: [buildQuoteProductWith('WHATEVER_VALUES')],
          currency: { token: '$', location: 'left', decimalToken: '.', decimalPlaces: 2 },
          displayDiscount: true,
          discount: '25.00',
          subtotal: '1000.00',
          shippingTotal: '50.00',
          taxTotal: '33.00',
          totalAmount: '1025.00',
        },
      },
    });

    server.use(
      graphql.query('GetQuoteInfoB2B', () => HttpResponse.json(quote)),
      graphql.query('SearchProducts', () =>
        HttpResponse.json(buildProductSearchWith('WHATEVER_VALUES')),
      ),
      graphql.query('getQuoteExtraFields', () =>
        HttpResponse.json(buildQuoteExtraFieldsWith('WHATEVER_VALUES')),
      ),
    );

    vitest.mocked(useParams).mockReturnValue({ id: '272989' });

    renderWithProviders(<QuoteDetail />, { preloadedState });

    expect(await screen.findByRole('heading', { name: 'Quote summary' })).toBeInTheDocument();

    expect(await screen.findByText('Original subtotal')).toBeInTheDocument();
    expect(screen.getByText('$1,000.00')).toBeInTheDocument();

    expect(screen.getByText('Discount amount')).toBeInTheDocument();
    expect(screen.getByText('-$25.00')).toBeInTheDocument();

    expect(screen.getByText('Quoted subtotal')).toBeInTheDocument();
    expect(screen.getByText('$975.00')).toBeInTheDocument();

    expect(screen.getByText('Shipping')).toBeInTheDocument();
    expect(screen.getByText('$50.00')).toBeInTheDocument();

    expect(screen.getByText('Tax')).toBeInTheDocument();
    expect(screen.getByText('$33.00')).toBeInTheDocument();

    expect(screen.getByText('Grand total')).toBeInTheDocument();
    expect(screen.getByText('$1,025.00')).toBeInTheDocument();
  });
});
