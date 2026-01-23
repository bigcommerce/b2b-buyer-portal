import { QuoteInfo } from '@/types/quotes';

type ValidKeys = 'contactInfo' | 'shippingAddress' | 'billingAddress';

const validateObject = (quoteInfo: QuoteInfo, key: ValidKeys) =>
  Object.values(quoteInfo[key]).every((x) => x === '' || x === 0);

export default validateObject;
