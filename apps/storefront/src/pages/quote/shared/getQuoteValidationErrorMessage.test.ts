import { describe, expect, it, vi } from 'vitest';

import {
  getQuoteValidationErrorMessage,
  QUOTE_VALIDATION_ERROR_CODES,
  QUOTE_VALIDATION_MESSAGE_CONTEXTS,
} from './getQuoteValidationErrorMessage';

describe('getQuoteValidationErrorMessage', () => {
  const b3Lang = vi.fn((key: string, params?: Record<string, unknown>) => {
    return `${key}::${JSON.stringify(params ?? {})}`;
  });

  it('returns PDP OOS message with name and qty', () => {
    const result = getQuoteValidationErrorMessage({
      b3Lang,
      context: QUOTE_VALIDATION_MESSAGE_CONTEXTS.PDP,
      errorCode: QUOTE_VALIDATION_ERROR_CODES.OOS,
      productName: 'My Product',
      availableToSell: 2,
    });

    expect(result).toEqual(
      'quoteDraft.productPageToQuote.outOfStock::{"name":"My Product","qty":2}',
    );
  });

  it('returns PDP unavailable message for non-purchasable and invalid fields', () => {
    const nonPurchasable = getQuoteValidationErrorMessage({
      b3Lang,
      context: QUOTE_VALIDATION_MESSAGE_CONTEXTS.PDP,
      errorCode: QUOTE_VALIDATION_ERROR_CODES.NON_PURCHASABLE,
      productName: 'Ignored',
    });

    const invalidFields = getQuoteValidationErrorMessage({
      b3Lang,
      context: QUOTE_VALIDATION_MESSAGE_CONTEXTS.PDP,
      errorCode: QUOTE_VALIDATION_ERROR_CODES.INVALID_FIELDS,
      productName: 'Ignored',
    });

    expect(nonPurchasable).toEqual('quoteDraft.productPageToQuote.unavailable::{}');
    expect(invalidFields).toEqual('quoteDraft.productPageToQuote.unavailable::{}');
  });

  it('returns quote insufficient stock for OOS', () => {
    const result = getQuoteValidationErrorMessage({
      b3Lang,
      errorCode: QUOTE_VALIDATION_ERROR_CODES.OOS,
      productName: 'My Product',
    });

    expect(result).toEqual('quoteDetail.message.insufficientStock::{"ProductName":"My Product"}');
  });

  it('returns quote non-purchasable message', () => {
    const result = getQuoteValidationErrorMessage({
      b3Lang,
      errorCode: QUOTE_VALIDATION_ERROR_CODES.NON_PURCHASABLE,
      productName: 'My Product',
    });

    expect(result).toEqual('quoteDetail.message.nonPurchasable::{"ProductName":"My Product"}');
  });

  it('falls back to productValidationFailed for network, other and unknown errors', () => {
    const networkError = getQuoteValidationErrorMessage({
      b3Lang,
      errorCode: QUOTE_VALIDATION_ERROR_CODES.NETWORK_ERROR,
      productName: 'Network Product',
    });

    const otherError = getQuoteValidationErrorMessage({
      b3Lang,
      errorCode: QUOTE_VALIDATION_ERROR_CODES.OTHER,
      productName: 'Other Product',
    });

    const unknownError = getQuoteValidationErrorMessage({
      b3Lang,
      errorCode: 'SOMETHING_NEW',
      productName: 'Unknown Product',
    });

    expect(networkError).toEqual(
      'quotes.productValidationFailed::{"productName":"Network Product"}',
    );
    expect(otherError).toEqual('quotes.productValidationFailed::{"productName":"Other Product"}');
    expect(unknownError).toEqual(
      'quotes.productValidationFailed::{"productName":"Unknown Product"}',
    );
  });

  it('uses fallback productValidationFailed when there is a network failure in PDP context', () => {
    const result = getQuoteValidationErrorMessage({
      b3Lang,
      context: QUOTE_VALIDATION_MESSAGE_CONTEXTS.PDP,
      errorCode: QUOTE_VALIDATION_ERROR_CODES.NETWORK_ERROR,
      productName: 'PDP Network Product',
    });

    expect(result).toEqual('quotes.productValidationFailed::{"productName":"PDP Network Product"}');
  });
});
