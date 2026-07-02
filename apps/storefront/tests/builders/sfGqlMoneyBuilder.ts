import type { Money } from '@/shared/service/bc/graphql/orders';

import { builder } from 'tests/test-utils';

const buildSfGqlMoneyDefaults = builder<Money>(() => ({
  currencyCode: 'USD',
  value: 100,
  formattedV2: '100',
}));

/** Builds SF GQL Money objects for unified order tests. */
export const buildSfGqlMoneyWith = (
  overrides: Parameters<typeof buildSfGqlMoneyDefaults>[0] = 'WHATEVER_VALUES',
): Money => {
  const money = buildSfGqlMoneyDefaults(overrides);
  if (overrides !== 'WHATEVER_VALUES' && overrides.formattedV2 === undefined) {
    return { ...money, formattedV2: String(money.value) };
  }
  return money;
};
