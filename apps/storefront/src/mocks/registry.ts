import { ordersMockOperations } from './domains/orders/registration';
import type { MockTransport, OwnedOperation } from './types';

export const ownedOperations: readonly OwnedOperation[] = [...ordersMockOperations];

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
