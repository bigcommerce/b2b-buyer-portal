import { buildGlobalStateWith, renderWithProviders, screen } from 'tests/test-utils';

import QuoteDetailSummary from './QuoteDetailSummary';

const expectationMessage = 'Backordered items will ship separately.';

const defaultProps = {
  quoteSummary: {
    originalSubtotal: 100,
    discount: 0,
    tax: 10,
    shipping: 5,
    totalAmount: 115,
  },
  quoteDetailTax: 0,
  quoteDetail: {
    shippingMethod: { id: 'flat_rate', description: 'Flat Rate' },
    currency: { token: '$', decimalToken: '.', thousandsToken: ',', decimalPlaces: 2 },
  },
  shouldHidePrice: false,
  hasBackorderedItems: true,
};

const withPromptEnabled = {
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
  },
};

describe('QuoteDetailSummary shipping expectation prompt', () => {
  it('shows the prompt when the quote is not an order', () => {
    renderWithProviders(<QuoteDetailSummary {...defaultProps} status="1" />, withPromptEnabled);

    expect(screen.getByText(expectationMessage)).toBeVisible();
  });

  it('hides the prompt when the quote has been converted to an order', () => {
    renderWithProviders(<QuoteDetailSummary {...defaultProps} status="4" />, withPromptEnabled);

    expect(screen.queryByText(expectationMessage)).toBeNull();
  });
});
