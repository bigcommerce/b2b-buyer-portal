import { builder } from 'tests/builder';

import type { Money } from '@/shared/service/bc/graphql/base';

const buildSfGqlMoneyDefaults = builder<Money>(() => ({
  currencyCode: 'USD',
  value: 100,
  formattedV2: '$100.00',
}));

export const buildSfGqlMoneyWith = (
  overrides: Parameters<typeof buildSfGqlMoneyDefaults>[0] = 'WHATEVER_VALUES',
): Money => {
  const money = buildSfGqlMoneyDefaults(overrides);
  if (overrides !== 'WHATEVER_VALUES' && overrides.formattedV2 === undefined) {
    return { ...money, formattedV2: `$${money.value.toFixed(2)}` };
  }
  return money;
};
