import { executeGetCustomerOrders } from './resolvers/orders';

export type MockTransport = 'b2b' | 'sf-direct' | 'sf-proxy';

export interface OperationExecutionContext {
  variables?: Record<string, unknown>;
}

export interface OwnedOperation {
  operationName: string;
  owner: 'buyer-portal-orders';
  transport: MockTransport;
  flow: 'my-orders-unified-orders-poc';
  execute: (context: OperationExecutionContext) => Promise<unknown>;
}

export const ownedOperations: OwnedOperation[] = [
  {
    operationName: 'GetCustomerOrders',
    owner: 'buyer-portal-orders',
    transport: 'sf-proxy',
    flow: 'my-orders-unified-orders-poc',
    execute: executeGetCustomerOrders,
  },
  {
    operationName: 'GetCustomerOrders',
    owner: 'buyer-portal-orders',
    transport: 'sf-direct',
    flow: 'my-orders-unified-orders-poc',
    execute: executeGetCustomerOrders,
  },
];

export function getOwnedOperation({
  operationName,
  transport,
}: {
  operationName?: string;
  transport: MockTransport;
}): OwnedOperation | undefined {
  if (!operationName) {
    return undefined;
  }

  return ownedOperations.find(
    (operation) => operation.operationName === operationName && operation.transport === transport,
  );
}
