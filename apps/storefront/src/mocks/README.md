# B3Request GraphQL Mock Router

This directory contains the request-layer GraphQL mock router used by local Vite development. The router sits behind the `B3Request` GraphQL methods in `src/shared/service/request/b3Fetch.ts`, so mock authors can replace selected GraphQL operations without changing page code.

## Scope

The router only applies to these `B3Request` methods and transports:

| Request method | Mock transport |
| --- | --- |
| `B3Request.graphqlB2B` | `b2b` |
| `B3Request.graphqlBC` | `sf-direct` |
| `B3Request.graphqlBCProxy` | `sf-proxy` |

It does not handle direct `fetch()` calls. Local mock mode is registered through the request seam, not a browser MSW worker.

## Runtime behavior

Local mock mode is active only when both conditions are true:

1. Vite is running in development mode.
2. `VITE_USE_MOCK_API=true` is set.

When mock mode is off, `B3Request` uses the real request path.

When mock mode is on, `B3Request` checks the operation name and transport before sending the request:

1. Registered operations return mock GraphQL envelopes from their resolver.
2. Unregistered operations pass through to the real request path.
3. If a registered resolver throws, the router returns this GraphQL error envelope:

```json
{
  "data": null,
  "errors": [{ "message": "Resolver error message" }]
}
```

The router accepts resolver return values that are already GraphQL envelopes, such as `{ data: ... }` or `{ data: ..., errors: ... }`. If a resolver returns a plain object without `data`, `errors`, or `extensions`, the router wraps it as `{ data: result }`.

Browser MSW is not started for local mock mode. The request router is invoked lazily by `B3Request` when a supported GraphQL method is called.

## Domain folder shape

Put mock code under a domain folder when the data and operations belong to the same product area.

```text
src/mocks/
  domains/
    orders/
      registration.ts
  resolvers/
    orders.ts
  stores/
    orders.ts
  registry.ts
  defineGraphQLMock.ts
  requestRouter.ts
```

Use these responsibilities:

| File | Responsibility |
| --- | --- |
| `domains/<domain>/registration.ts` | Registers operation names, owner, flow, transports, and resolver functions. |
| `resolvers/<domain>.ts` | Builds GraphQL response envelopes from mock stores and request variables. |
| `stores/<domain>.ts` | Holds seeded mock data and domain-specific data helpers. |
| `registry.ts` | Collects registered operations for the router. |

Add new domains by creating a domain registration file, adding any resolver and store files it needs, then adding the domain operations to `ownedOperations` in `registry.ts`.

## Creating a new mock

Use this order when adding a mock operation. The mock router matches by GraphQL operation name and transport, so start from the production caller and work back toward the registry.

1. **Find the production request.** Locate the `B3Request.graphqlB2B`, `B3Request.graphqlBC`, or `B3Request.graphqlBCProxy` call and copy the named GraphQL operation exactly. For example, `getOrderDetail` sends `query GetOrderDetail($entityId: Int!)`.
2. **Choose transports.** Use the table in [Scope](#scope): `graphqlB2B` maps to `b2b`, `graphqlBC` maps to `sf-direct`, and `graphqlBCProxy` maps to `sf-proxy`. Register every transport the feature can use locally.
3. **Create or extend domain types.** Put request/response data shapes in `domains/<domain>/types.ts` when the mock store needs local types. Keep these types narrow and avoid importing service-layer modules from `src/shared/service/**`.
4. **Create or extend the store.** Add deterministic seed data in `stores/<domain>.ts`, seed it when the module loads, and expose lookup helpers for resolvers. Store helpers should return stable data and expose reset/seed helpers when tests need clean state.
5. **Write the resolver.** Add `execute<OperationName>` in `resolvers/<domain>.ts`. Treat `variables` as `unknown`, narrow them before use, and return the GraphQL envelope the production caller expects.
6. **Register the operation.** Add a `defineGraphQLMock` entry in `domains/<domain>/registration.ts` with the exact `operationName`, a stable `owner`, a short `flow`, the chosen `transports`, and the resolver function.
7. **Wire new domains into the registry.** If this is a new domain, import its `<domain>MockOperations` in `registry.ts` and append it to `ownedOperations`. Existing domains only need the registration file update.
8. **Cover the behavior with tests.** Add or update store/resolver tests for response shape and variable handling, registry tests for operation + transport registration, and request-router tests proving the operation returns a mocked response instead of passing through.
9. **Run the focused suite.** From `apps/storefront`, run `yarn test src/mocks --run`. Use `yarn dev:mock` or set `VITE_USE_MOCK_API=true` when manually exercising the mock in local dev.

For an existing domain, the usual edit set is:

```text
src/mocks/domains/<domain>/registration.ts
src/mocks/resolvers/<domain>.ts
src/mocks/stores/<domain>.ts
src/mocks/**/<domain>.test.ts
```

For a new domain, also update:

```text
src/mocks/registry.ts
src/mocks/registry.test.ts
```

Use `owner` to identify the product area that owns the mock, such as `buyer-portal-orders`. Use `flow` to identify the local feature or proof-of-concept path that needs it, such as `my-orders-unified-orders-poc`.

## Type ownership

Mock domain types should stay local to the mock domain unless there is a dependency-clean shared contract. Do not import handwritten service-layer GraphQL types from `src/shared/service/**` into mock stores or resolvers when those service modules import `B3Request`; that creates a cycle back through the request router.

Use this split:

1. `stores/<domain>.ts` and `domains/<domain>/types.ts` model deterministic mock data.
2. `resolvers/<domain>.ts` maps mock data into the GraphQL envelope expected by the production caller.
3. Generated GraphQL types from `src/types/gql/graphql.ts` may be used at the response boundary when their shape matches the operation, but they should not force the mock store to use wire-only shapes.

This means a mock domain may intentionally duplicate a small type shape from a service file. Keep that duplication narrow and document why it exists near the domain types when it prevents an import cycle.

## Orders registration example

The Orders domain registers `GetCustomerOrders` for both storefront transports because the feature can call the BigCommerce storefront GraphQL API directly or through the B2B proxy.

```ts
import { defineGraphQLMock } from '../../defineGraphQLMock';
import { executeGetCustomerOrders } from '../../resolvers/orders';

export const ordersMockOperations = [
  ...defineGraphQLMock({
    operationName: 'GetCustomerOrders',
    owner: 'buyer-portal-orders',
    flow: 'my-orders-unified-orders-poc',
    transports: ['sf-proxy', 'sf-direct'],
    execute: executeGetCustomerOrders,
  }),
];
```

`defineGraphQLMock` expands one operation definition into one registered operation per transport. The router matches on both `operationName` and `transport`, so register every transport the feature actually uses.

When a domain owns more than one operation, keep the exported domain variable and add another spread entry instead of creating a second exported registry variable:

```ts
import { defineGraphQLMock } from '../../defineGraphQLMock';
import { executeGetCustomerOrders, executeGetOrderDetail } from '../../resolvers/orders';

export const ordersMockOperations = [
  ...defineGraphQLMock({
    operationName: 'GetCustomerOrders',
    owner: 'buyer-portal-orders',
    flow: 'my-orders-unified-orders-poc',
    transports: ['sf-proxy', 'sf-direct'],
    execute: executeGetCustomerOrders,
  }),
  ...defineGraphQLMock({
    operationName: 'GetOrderDetail',
    owner: 'buyer-portal-orders',
    flow: 'my-orders-unified-orders-poc',
    transports: ['sf-proxy', 'sf-direct'],
    execute: executeGetOrderDetail,
  }),
];
```

Adding a new mock operation should follow this process:

1. Add or extend the mock-domain store data shape.
2. Add a resolver that narrows `variables` from `unknown` and returns the GraphQL envelope expected by the caller.
3. Add the operation to the existing domain registration export.
4. Add focused resolver, registry, and request-router coverage for the operation and passthrough behavior.

## Resolver expectations

Resolvers receive an `OperationExecutionContext` with normalized request variables from the `B3Request` call.

```ts
export interface OperationExecutionContext {
  variables?: unknown;
}
```

Resolvers should:

1. Return a Promise.
2. Return a GraphQL-style envelope when the caller expects GraphQL response shape.
3. Read only from mock stores or local deterministic data.
4. Treat variables as `unknown` input and narrow them before use.
5. Throw an `Error` when a registered operation should respond with a GraphQL error envelope.
6. Avoid side effects that make later tests or local requests depend on call order unless the domain store explicitly models that state.

Example resolver shape:

```ts
export async function executeGetCustomerOrders({
  variables,
}: OperationExecutionContext = {}): Promise<SuccessfulGetCustomerOrdersResponse> {
  const normalizedVariables = normalizeVariables(variables);
  const orders = orderStore.getOrders();

  return {
    data: {
      customer: {
        orders: buildOrdersConnection(orders, normalizedVariables),
      },
    },
  };
}
```

## Test checklist

Before adding or changing a mock operation, cover the behavior at the narrowest useful layer:

1. `defineGraphQLMock` expands the operation across all requested transports.
2. `registry.ts` includes the domain registration and matches by operation name plus transport.
3. `requestRouter.ts` returns a mocked response for registered operations.
4. `requestRouter.ts` passes through unregistered, anonymous, or malformed operations.
5. Resolver failures return `{ data: null, errors: [{ message }] }`.
6. Domain resolvers return the GraphQL envelope shape expected by the production caller.
7. Resolver variable handling covers missing, partial, and invalid variables.
8. Mock mode stays gated by `import.meta.env.DEV` and `VITE_USE_MOCK_API === 'true'`.

Run focused tests from `apps/storefront` when changing mocks:

```sh
yarn test src/mocks --run
```
