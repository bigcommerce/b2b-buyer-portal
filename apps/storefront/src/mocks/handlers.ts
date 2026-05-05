import { graphql, HttpResponse, passthrough } from 'msw';

import { getAPIBaseURL } from '@/shared/service/request/base';

import { logMockDecision } from './devLog';
import type { MockTransport } from './registry';
import { getOwnedOperation } from './registry';

type GraphQLMockBody = Record<string, unknown>;

type ResolveResult = { kind: 'mocked'; body: GraphQLMockBody } | { kind: 'passthrough' };

interface ResolveGraphQLMockArgs {
  operationName?: string;
  transport: MockTransport;
  variables?: Record<string, unknown>;
}

function getMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Mock resolver failed';
}

function isGraphQLMockBody(value: unknown): value is GraphQLMockBody {
  return (
    Boolean(value) &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    ('data' in value || 'errors' in value || 'extensions' in value)
  );
}

export async function resolveGraphQLMock({
  operationName,
  transport,
  variables,
}: ResolveGraphQLMockArgs): Promise<ResolveResult> {
  const operation = getOwnedOperation({ operationName, transport });

  if (!operation) {
    logMockDecision(`passthrough ${operationName ?? 'anonymous operation'} via ${transport}`);

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

async function handleOperation(args: ResolveGraphQLMockArgs) {
  const result = await resolveGraphQLMock(args);

  if (result.kind === 'passthrough') {
    return passthrough();
  }

  return HttpResponse.json(result.body);
}

const b2bLink = graphql.link(import.meta.env.VITE_B2B_URL || getAPIBaseURL());
const sfProxyLink = graphql.link(
  `${import.meta.env.VITE_B2B_URL || getAPIBaseURL()}/api/v3/proxy/bc-storefront/graphql`,
);
const sfDevProxyLink = graphql.link(
  import.meta.env.VITE_STOREFRONT_GRAPHQL_URL || '/bigcommerce/graphql',
);

export const handlers = [
  b2bLink.operation(({ operationName, variables }) =>
    handleOperation({ operationName, variables, transport: 'b2b' }),
  ),
  sfProxyLink.operation(({ operationName, variables }) =>
    handleOperation({ operationName, variables, transport: 'sf-proxy' }),
  ),
  sfDevProxyLink.operation(({ operationName, variables }) =>
    handleOperation({ operationName, variables, transport: 'sf-direct' }),
  ),
];
