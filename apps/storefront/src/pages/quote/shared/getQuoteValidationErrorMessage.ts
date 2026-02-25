import { LangFormatFunction } from '@/lib/lang';
import { QUOTE_VALIDATION_ERROR_CODES } from '@/shared/service/b2b/graphql/product';

export { QUOTE_VALIDATION_ERROR_CODES };

export const QUOTE_VALIDATION_MESSAGE_CONTEXTS = {
  QUOTE: 'quote',
  PDP: 'pdp',
} as const;

type QuoteValidationMessageContext =
  (typeof QUOTE_VALIDATION_MESSAGE_CONTEXTS)[keyof typeof QUOTE_VALIDATION_MESSAGE_CONTEXTS];

interface GetQuoteValidationErrorMessageInput {
  b3Lang: LangFormatFunction;
  errorCode: string;
  productName?: string;
  availableToSell?: number;
  context?: QuoteValidationMessageContext;
}

export const getQuoteValidationErrorMessage = ({
  b3Lang,
  errorCode,
  productName = '',
  availableToSell = 0,
  context = QUOTE_VALIDATION_MESSAGE_CONTEXTS.QUOTE,
}: GetQuoteValidationErrorMessageInput): string => {
  if (context === QUOTE_VALIDATION_MESSAGE_CONTEXTS.PDP) {
    if (errorCode === QUOTE_VALIDATION_ERROR_CODES.OOS) {
      return b3Lang('quoteDraft.productPageToQuote.outOfStock', {
        name: productName,
        qty: availableToSell,
      });
    }

    if (
      errorCode === QUOTE_VALIDATION_ERROR_CODES.NON_PURCHASABLE ||
      errorCode === QUOTE_VALIDATION_ERROR_CODES.INVALID_FIELDS ||
      errorCode === QUOTE_VALIDATION_ERROR_CODES.OTHER
    ) {
      return b3Lang('quoteDraft.productPageToQuote.unavailable');
    }
  }

  if (errorCode === QUOTE_VALIDATION_ERROR_CODES.OOS) {
    return b3Lang('quoteDetail.message.insufficientStock', {
      ProductName: productName,
    });
  }

  if (errorCode === QUOTE_VALIDATION_ERROR_CODES.NON_PURCHASABLE) {
    return b3Lang('quoteDetail.message.nonPurchasable', {
      ProductName: productName,
    });
  }

  return b3Lang('quotes.productValidationFailed', {
    productName,
  });
};
