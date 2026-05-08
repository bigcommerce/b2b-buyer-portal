export type MockTransport = 'b2b' | 'sf-direct' | 'sf-proxy';

export type MockOwner = 'buyer-portal-orders';

export type MockFlow = 'my-orders-unified-orders-poc';

export interface OperationExecutionContext {
  variables?: unknown;
}

export interface OwnedOperation<TResult = unknown> {
  operationName: string;
  owner: MockOwner;
  transport: MockTransport;
  flow: MockFlow;
  execute: (context: OperationExecutionContext) => Promise<TResult>;
}

export type GraphQLMockBody = Record<string, unknown>;

export type ResolveResult = { kind: 'mocked'; body: GraphQLMockBody } | { kind: 'passthrough' };

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
