export const AWAITING_PAYMENT_STATUS_VALUE = 'AWAITING_PAYMENT';

const LEGACY_STATUS_ID_TO_VALUE: Record<number, string> = {
  7: AWAITING_PAYMENT_STATUS_VALUE,
};

export const normaliseLegacyStatusCode = (statusId: number): string | number =>
  LEGACY_STATUS_ID_TO_VALUE[statusId] ?? statusId;
