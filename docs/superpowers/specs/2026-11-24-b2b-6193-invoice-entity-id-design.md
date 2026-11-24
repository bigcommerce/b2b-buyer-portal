# B2B-6193: Read SF GQL `Order.invoice.entityId` in order detail

Status: approved by the user in conversation on 2026-11-24 (short design, small change).
Ticket: https://bigcommercecloud.atlassian.net/browse/B2B-6193 (3 points, blocked by B2B-6135)

## Intent and why

On the unified orders path (flag `B2B-4613.buyer_portal_unified_sf_gql_orders`), Order Detail shows
**View Invoice** and opens `/invoice?invoiceId=<id>`. Today it reads the id from SF GQL
`Order.invoice.id` (String). BE is moving the numeric invoice identifier to `invoice.entityId` (Int),
matching how SF GQL exposes direct ids elsewhere (`Order.entityId`, `OrderCompany.entityId`), because
`id` will eventually become a Relay node ID (PROJECT-8703). The buyer portal only needs the numeric id.

## Goals

- `GetOrderDetail` selects `invoice { entityId }` and no longer selects `invoice { id }`.
- `OrderInvoice` is typed `{ entityId: number }`.
- `convertOrderDetail` sets `invoiceId` from `order.invoice.entityId` with no `Number()` coercion.
- First test coverage anywhere for View Invoice with a real invoice.

## Non-goals / anti-goals

- No change to `ipStatus: order.invoice ? 1 : 0`, to list pages, or to the legacy (flag OFF) path.
- Not fixing View Invoice being hidden for invoice-less orders where `placedBy.email` is null
  (orders-migration-guide section 8). Separate issue.
- Anti-goal: shipping before `entityId` is deployed. An unknown selected field fails the whole
  `GetOrderDetail` query, so the order detail page would break for every unified-flag store.

## What was verified (2026-11-24)

- The ticket's 3 touchpoints match `main`: `orders.ts` fragment (`invoice { id }`, line ~528),
  `OrderInvoice` interface (line ~166), `convertOrderDetail.ts:513`.
- `orderB2BFields` is spread only into `GET_ORDER_DETAIL`; `GET_COMPANY_ORDERS` and
  `GET_CUSTOMER_ORDERS` do not select `invoice`.
- The other three mocks use `invoice: null` (`mapSfGqlOrderToListItem.test.ts:52`,
  `unified-company-orders.test.tsx:92`, `unified-orders.test.tsx:96`); `null` still satisfies
  `OrderInvoice | null`, so they should need no change (`yarn tsc --noEmit` confirms).
- Baseline: `index.unified.test.tsx` + `mapSfGqlOrderToListItem.test.ts` = 51/51 passing.
- No test in the repo exercises View Invoice (legacy or unified).
- `/invoice?invoiceId=` is read in `pages/Invoice/index.tsx` and used as a list search filter, so a
  numeric id works. B2B GQL types the order's `invoiceId` as `Int`, same as `entityId: Int!`.
- BE state: b2b-api #258 (B2B-6135) is merged (2026-11-23) but does NOT add `entityId`.
  `entityId` comes from bigcommerce/storefront #6351: draft, behind `master`, review required,
  CI green. Its diff keeps `id: ID!` and adds `entityId: Int!` (non-null); a non-numeric upstream id
  drops `invoice` to null instead of failing. docs-v2 #1174 dates the deploy 2026-12-07 (end of the
  release freeze). **Not verified:** the live schema. There is no codegen for SF GQL orders here
  (query is a hand-written string), so the only evidence for `entityId` is the PR diff.

## Constraints

- Hard merge gate: do not merge or release until storefront #6351 is deployed to the target
  environment. The FE cannot hedge by selecting both `id` and `entityId`; a missing field fails the query.
- Run commands from `apps/storefront/`. Follow AGENTS.md test rules (builders, `renderWithProviders`,
  MSW via `server.use`, `userEvent`, role-based queries, test names without "should").

## Approaches considered

1. **Do exactly what the ticket says, test-first, draft PR held until BE deploys. (Chosen.)**
2. Select both `id` and `entityId` and prefer `entityId` at runtime. Rejected: an unknown field
   fails the whole query, so it gives no safety before deploy and leaves dead `id` usage afterwards.
3. Wait for #6351 to deploy, then implement. Rejected: nothing is learned by waiting; the change is
   tiny and can be reviewed now behind the merge gate.

## Design

- `apps/storefront/src/shared/service/bc/graphql/orders.ts`: `OrderInvoice` becomes
  `{ entityId: number }`; fragment `invoice { entityId }`.
- `apps/storefront/src/pages/OrderDetail/shared/convertOrderDetail.ts`:
  `invoiceId: order.invoice ? order.invoice.entityId : 0`.
- Tests in `apps/storefront/src/pages/OrderDetail/index.unified.test.tsx`:
  1. Query selects `invoice { entityId }` and not `invoice { id }` (same capture pattern as the
     existing query-shape tests).
  2. B2B user with `get_invoices` sees **View Invoice** on an invoiced order; clicking it calls
     `view.navigation` with `/invoice?invoiceId=<entityId>`.
  3. With `invoice: null`, a B2B user who did not place the order does not see **View Invoice**.
- Screenshots: add an invoiced order to the local-only `local/screenshot-mocks` branch (never pushed).

## Left to the builder

- Exact B2B test state. Known facts: `isB2BUserSelector` is true for `userType: MULTIPLE_B2C` with
  `companyInfo.status: APPROVED` (or SUPER_ADMIN). `verifyLevelPermission` reads the global store,
  which `renderWithProviders` already points at the per-render store, so `preloadedState` works.
  Grant `{ code: 'get_invoices', permissionLevel: permissionLevels.COMPANY }` (import from
  `@/constants`) and set `companyInfo.id` equal to the order's `company.entityId`.
  `placedBy.email` must differ from `customer.emailAddress` for test 3.
- Whether the existing preloaded B2C state needs a sibling B2B state constant.
- Any extra MSW handlers a B2B render needs (unmocked requests hang, which only matters if the page awaits them).

## Pre-merge checklist

- `yarn test` (touched files), `yarn lint`, `yarn tsc --noEmit` from `apps/storefront/`.
- Storefront #6351 deployed to the target environment, and a real `GetOrderDetail` selecting
  `invoice { entityId }` succeeds there for an invoiced order.
- Opened PR is a draft until the gate above is met.
