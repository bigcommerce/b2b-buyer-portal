import { PersistPartial } from 'redux-persist/es/persistReducer';
import { buildGlobalStateWith, renderWithProviders, screen } from 'tests/test-utils';

import { QuoteInfoState } from '@/store/slices/quoteInfo';
import { QuoteItem } from '@/types/quotes';

import QuoteSummary from './QuoteSummary';

const expectationMessage = 'Backordered items will ship separately.';

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

function buildQuoteInfoWithList(draftQuoteList: QuoteItem[]): QuoteInfoState & PersistPartial {
  return {
    draftQuoteList,
    draftQuoteInfo: emptyDraftQuoteInfo,
    quoteDetailToCheckoutUrl: '',
    _persist: { version: 1, rehydrated: true },
  };
}

const withPromptEnabled = (draftQuoteList: QuoteItem[]) => ({
  preloadedState: {
    global: buildGlobalStateWith({
      backorderEnabled: true,
      backorderDisplaySettings: {
        showDefaultShippingExpectationPrompt: true,
        defaultShippingExpectationPrompt: expectationMessage,
      },
      featureFlags: {
        'BACK-134.backorders_phase_1_1_control_messaging_on_storefront': true,
      },
    }),
    quoteInfo: buildQuoteInfoWithList(draftQuoteList),
  },
});

const withMessagingFlagDisabled = (draftQuoteList: QuoteItem[]) => ({
  preloadedState: {
    global: buildGlobalStateWith({
      backorderEnabled: true,
      backorderDisplaySettings: {
        showDefaultShippingExpectationPrompt: true,
        defaultShippingExpectationPrompt: expectationMessage,
      },
      featureFlags: {
        'BACK-134.backorders_phase_1_1_control_messaging_on_storefront': false,
      },
    }),
    quoteInfo: buildQuoteInfoWithList(draftQuoteList),
  },
});

const withBackorderDisabled = (draftQuoteList: QuoteItem[]) => ({
  preloadedState: {
    global: buildGlobalStateWith({
      backorderEnabled: false,
      backorderDisplaySettings: {
        showDefaultShippingExpectationPrompt: true,
        defaultShippingExpectationPrompt: expectationMessage,
      },
      featureFlags: {
        'BACK-134.backorders_phase_1_1_control_messaging_on_storefront': true,
      },
    }),
    quoteInfo: buildQuoteInfoWithList(draftQuoteList),
  },
});

const withDefaultShippingExpectationPromptDisabled = (draftQuoteList: QuoteItem[]) => ({
  preloadedState: {
    global: buildGlobalStateWith({
      backorderEnabled: true,
      backorderDisplaySettings: {
        showDefaultShippingExpectationPrompt: false,
        defaultShippingExpectationPrompt: expectationMessage,
      },
      featureFlags: {
        'BACK-134.backorders_phase_1_1_control_messaging_on_storefront': true,
      },
    }),
    quoteInfo: buildQuoteInfoWithList(draftQuoteList),
  },
});

const lineItemWithBackorder: QuoteItem = {
  node: {
    id: 'item-1',
    basePrice: 10,
    taxPrice: 0,
    quantity: 10,
    variantSku: 'V1',
    productsSearch: {
      inventoryTracking: 'product',
      totalOnHand: 3,
      availableToSell: 10,
      unlimitedBackorder: false,
      backorderMessage: 'Restock soon',
    },
  },
} as QuoteItem;

const lineItemInStock: QuoteItem = {
  node: {
    id: 'item-1',
    basePrice: 10,
    taxPrice: 0,
    quantity: 2,
    variantSku: 'V1',
    productsSearch: {
      inventoryTracking: 'product',
      totalOnHand: 5,
      availableToSell: 10,
      unlimitedBackorder: false,
    },
  },
} as QuoteItem;

describe('QuoteSummary shipping expectation prompt', () => {
  it('shows the prompt when the draft has backordered items and messaging is enabled', () => {
    renderWithProviders(<QuoteSummary />, withPromptEnabled([lineItemWithBackorder]));

    expect(screen.getByText(expectationMessage)).toBeVisible();
  });

  it('hides the prompt when no item qualifies as backordered for display', () => {
    renderWithProviders(<QuoteSummary />, withPromptEnabled([lineItemInStock]));

    expect(screen.queryByText(expectationMessage)).toBeNull();
  });

  it('hides the prompt when storefront messaging feature flag is off, even with backordered items', () => {
    renderWithProviders(<QuoteSummary />, withMessagingFlagDisabled([lineItemWithBackorder]));

    expect(screen.queryByText(expectationMessage)).toBeNull();
  });

  it('hides the prompt when backorders are disabled for the store, even with backordered items', () => {
    renderWithProviders(<QuoteSummary />, withBackorderDisabled([lineItemWithBackorder]));

    expect(screen.queryByText(expectationMessage)).toBeNull();
  });

  it('hides the default shipping expectation prompt when showDefaultShippingExpectationPrompt is false, even with backordered items and messaging on', () => {
    renderWithProviders(
      <QuoteSummary />,
      withDefaultShippingExpectationPromptDisabled([lineItemWithBackorder]),
    );

    expect(screen.queryByText(expectationMessage)).toBeNull();
  });
});
