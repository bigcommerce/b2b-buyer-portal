import { buildGlobalStateWith, renderWithProviders, screen } from 'tests/test-utils';

import QuoteDetailSummary from './QuoteDetailSummary';

const expectationMessage = 'Backordered items will ship separately.';

const defaultProps = {
  quoteSummary: {
    originalSubtotal: 100,
    quotedSubtotal: 100,
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
    }),
  },
};

const summaryRowValue = (label: string) => {
  const row = screen
    .getAllByRole('row')
    .find((candidate) => candidate.textContent?.startsWith(label));

  return row?.textContent?.slice(label.length);
};

describe('QuoteDetailSummary quoted subtotal', () => {
  const withDiscountDisplayed = (quoteSummary: Record<string, number>) => ({
    ...defaultProps,
    quoteSummary: { ...defaultProps.quoteSummary, ...quoteSummary },
    quoteDetail: { ...defaultProps.quoteDetail, displayDiscount: true, salesRepEmail: 'a@b.com' },
  });

  it('renders the quoted subtotal it is given rather than deriving it from the discount', () => {
    renderWithProviders(
      <QuoteDetailSummary
        {...withDiscountDisplayed({
          originalSubtotal: 100,
          quotedSubtotal: 200,
          discount: 0,
          totalAmount: 215,
        })}
        status="5"
      />,
    );

    expect(summaryRowValue('Quoted subtotal')).toBe('$200.00');
    expect(summaryRowValue('Original subtotal')).toBe('$100.00');
  });

  it('still renders a marked-down quote correctly', () => {
    renderWithProviders(
      <QuoteDetailSummary
        {...withDiscountDisplayed({
          originalSubtotal: 100,
          quotedSubtotal: 80,
          discount: 20,
          totalAmount: 95,
        })}
        status="5"
      />,
    );

    expect(summaryRowValue('Quoted subtotal')).toBe('$80.00');
    expect(summaryRowValue('Original subtotal')).toBe('$100.00');
    expect(summaryRowValue('Discount amount')).toBe('-$20.00');
  });

  it('keeps the quoted subtotal consistent with the grand total for a marked-up quote', () => {
    renderWithProviders(
      <QuoteDetailSummary
        {...withDiscountDisplayed({
          originalSubtotal: 100,
          quotedSubtotal: 200,
          discount: 0,
          tax: 10,
          shipping: 5,
          totalAmount: 215,
        })}
        status="5"
      />,
    );

    expect(summaryRowValue('Quoted subtotal')).toBe('$200.00');
    expect(summaryRowValue('Grand total')).toBe('$215.00');
  });
});

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
