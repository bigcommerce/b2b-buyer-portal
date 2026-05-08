import { describe, expect, it } from 'vitest';

import { defineGraphQLMock } from './defineGraphQLMock';

interface TestResult {
  customer: { id: string };
}

function getFirstVariable(variables: unknown): number {
  if (!variables || typeof variables !== 'object' || !('first' in variables)) {
    return 0;
  }

  const { first } = variables;

  return typeof first === 'number' ? first : 0;
}

describe('defineGraphQLMock', () => {
  it('creates one registry entry per transport', async () => {
    const entries = defineGraphQLMock<TestResult>({
      operationName: 'GetCustomerOrders',
      owner: 'buyer-portal-orders',
      flow: 'my-orders-unified-orders-poc',
      transports: ['sf-proxy', 'sf-direct'],
      execute: async ({ variables }) => ({
        customer: { id: `customer-${getFirstVariable(variables)}` },
      }),
    });

    expect(entries).toHaveLength(2);
    expect(entries.map((entry) => entry.transport)).toEqual(['sf-proxy', 'sf-direct']);
    expect(await entries[0].execute({ variables: { first: 3 } })).toEqual({
      customer: { id: 'customer-3' },
    });
  });
});
