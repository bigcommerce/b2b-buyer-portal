import type { MockFlow, MockOwner, MockTransport, OwnedOperation } from './types';

interface DefineGraphQLMockArgs<TResult> {
  operationName: string;
  owner: MockOwner;
  flow: MockFlow;
  transports: readonly MockTransport[];
  execute: OwnedOperation<TResult>['execute'];
}

export function defineGraphQLMock<TResult>({
  operationName,
  owner,
  flow,
  transports,
  execute,
}: DefineGraphQLMockArgs<TResult>): OwnedOperation<TResult>[] {
  return transports.map((transport) => ({
    operationName,
    owner,
    flow,
    transport,
    execute,
  }));
}
