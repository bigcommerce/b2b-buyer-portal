import { AWAITING_PAYMENT_STATUS_VALUE, normaliseLegacyStatusCode } from './orderStatus';

describe('normaliseLegacyStatusCode', () => {
  it('maps the legacy awaiting-payment statusId to the unified status value', () => {
    expect(normaliseLegacyStatusCode(7)).toBe(AWAITING_PAYMENT_STATUS_VALUE);
  });

  it('passes through statusIds that have no mapping', () => {
    expect(normaliseLegacyStatusCode(2)).toBe(2);
  });
});
