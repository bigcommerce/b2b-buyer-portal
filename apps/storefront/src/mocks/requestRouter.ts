import { parse } from 'graphql';

import { logMockDecision } from './devLog';
import { getOwnedOperation } from './registry';
import type { GraphQLMockBody, MockTransport, ResolveResult } from './types';

interface ResolveB3GraphQLMockRequestArgs {
  transport: MockTransport;
  request: {
    query: string;
    variables?: Record<string, unknown>;
  };
}

interface ResolveRegisteredGraphQLMockArgs {
  operationName?: string;
  transport: MockTransport;
  variables?: Record<string, unknown>;
}

function getMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Mock resolver failed';
}

function isGraphQLMockBody(value: unknown): value is GraphQLMockBody {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    ('data' in value || 'errors' in value || 'extensions' in value)
  );
}

export function extractOperationName(query: string): string | undefined {
  try {
    const document = parse(query);
    const operation = document.definitions.find(
      (definition) => definition.kind === 'OperationDefinition' && definition.name?.value,
    );

    return operation?.kind === 'OperationDefinition' ? operation.name?.value : undefined;
  } catch {
    return undefined;
  }
}

export async function resolveRegisteredGraphQLMock({
  operationName,
  transport,
  variables,
}: ResolveRegisteredGraphQLMockArgs): Promise<ResolveResult> {
  const operation = getOwnedOperation({ operationName, transport });

  if (!operation) {
    logMockDecision(
      `passthrough ${operationName ?? 'anonymous or malformed operation'} via ${transport}`,
    );

    return { kind: 'passthrough' };
  }

  try {
    const body = await operation.execute({ variables });

    logMockDecision(`mocked ${operation.operationName} via ${transport}`);

    return { kind: 'mocked', body: isGraphQLMockBody(body) ? body : { data: body } };
  } catch (error: unknown) {
    const message = getMessage(error);

    logMockDecision(`error ${operation.operationName} via ${transport}: ${message}`);

    return {
      kind: 'mocked',
      body: {
        data: null,
        errors: [{ message }],
      },
    };
  }
}

export async function resolveB3GraphQLMockRequest({
  transport,
  request,
}: ResolveB3GraphQLMockRequestArgs): Promise<ResolveResult> {
  const operationName = extractOperationName(request.query);

  return resolveRegisteredGraphQLMock({
    operationName,
    transport,
    variables: request.variables,
  });
}
