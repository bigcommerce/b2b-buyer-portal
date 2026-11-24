# B2B-6193 Invoice `entityId` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Order Detail's View Invoice reads the numeric invoice id from SF GQL `Order.invoice.entityId` instead of `invoice.id`, with the first test coverage for View Invoice.

**Architecture:** Three-line production change (fragment, type, converter) driven by tests added to the existing `index.unified.test.tsx`. Guard-rail tests pin the unchanged `invoice: null` behavior. A local-only mock branch supports screenshots. The PR stays draft until storefront #6351 is deployed.

**Tech Stack:** React 18, TypeScript, Vitest 4, Testing Library, MSW.

**Spec:** `docs/superpowers/specs/2026-11-24-b2b-6193-invoice-entity-id-design.md`

## Global Constraints

- Run every command from `apps/storefront/` unless a step says repo root.
- `OrderInvoice` is `{ entityId: number }`; fragment is `invoice { entityId }`; converter is `invoiceId: order.invoice ? order.invoice.entityId : 0`; `ipStatus: order.invoice ? 1 : 0` is unchanged.
- Hard merge gate: do not merge or release until bigcommerce/storefront #6351 is deployed to the target environment. Do not select both `id` and `entityId`.
- Tests follow AGENTS.md: builders and `faker` for data (no hardcoded values), `renderWithProviders`, MSW via `server.use`, `userEvent`, role-based queries, test names without "should".
- Commit format `type(scope): B2B-6193 message`, scope `orders` (or `docs`). No `Co-Authored-By` trailer (the user's standing preference). Only the user can say when to push or open a PR.

## Review Focus

Input classes the spec implies but its three listed tests don't cover (each is pinned by a test in Task 2):

1. Invoiced order, B2B user without `get_invoices`: View Invoice stays hidden.
2. Invoiced order, B2C user: sees "print invoice", never "view invoice".
3. Invoice-less order the B2B user placed: View Invoice shows but must never navigate to `/invoice?invoiceId=0`.
4. Invoice-less order a B2B user did not place: View Invoice stays hidden (the spec's test 3).

---

### Task 1: Read `entityId` (test-first)

**Files:**
- Modify: `apps/storefront/src/shared/service/bc/graphql/orders.ts` (interface ~line 166, fragment ~line 528)
- Modify: `apps/storefront/src/pages/OrderDetail/shared/convertOrderDetail.ts:513`
- Test: `apps/storefront/src/pages/OrderDetail/index.unified.test.tsx`

**Interfaces:**
- Produces: `OrderInvoice = { entityId: number }`; `renderOrderDetails(state?: typeof preloadedState)` in the test file, defaulting to the existing module-level `preloadedState`. Task 2 reuses both.

- [ ] **Step 1: Branch and commit the docs.** From repo root: `git fetch origin main && git switch -c B2B-6193 origin/main`, then `git add docs/superpowers/specs/2026-11-24-b2b-6193-invoice-entity-id-design.md docs/superpowers/plans/2026-11-24-b2b-6193-invoice-entity-id.md` and commit `docs(docs): B2B-6193 add invoice entityId design and plan`. Add only those two paths; other untracked root files are not part of this work.

- [ ] **Step 2: Make `renderOrderDetails` accept a state.** Change its signature to `async function renderOrderDetails(state: typeof preloadedState = preloadedState)` and pass `state` as `preloadedState` to `renderWithProviders`. Add imports: `CompanyStatus`, `UserTypes` to the existing `@/types` import; `permissionLevels` from `@/constants`. Run the file; all 47 existing tests still pass.

- [ ] **Step 3: Write the failing tests.** Add `describe('B2B-6193: view invoice', ...)` at the end of the top-level `describe`, with:
  - Setup: `companyId = faker.number.int({ min: 1, max: 99999 })`, `buyerEmail = faker.internet.email()`, and `b2bBuyerState = { ...preloadedState, company: buildCompanyStateWith({ companyInfo: { id: String(companyId), status: CompanyStatus.APPROVED, companyName: faker.company.name() }, customer: { userType: UserTypes.MULTIPLE_B2C, role: CustomerRole.SENIOR_BUYER, emailAddress: buyerEmail }, permissions: [{ code: 'get_invoices', permissionLevel: permissionLevels.COMPANY }] }) }`.
  - A local helper `serveOrder(order: Order)` that does `server.use(graphql.query('GetOrderDetail', () => HttpResponse.json(buildOrderDetailResponseWith({ data: { site: { order } } }))))`.
  - `it('requests invoice entityId and never invoice id')`: capture `query` as the existing query-shape tests do, render with the default state, then `expect(capturedQuery).toMatch(/invoice\s*\{\s*entityId\s*\}/)` and `expect(capturedQuery).not.toMatch(/invoice\s*\{\s*id\s*\}/)`.
  - `it('opens the invoice page with the invoice entityId')`: `entityId = faker.number.int({ min: 1, max: 99999 })`; `serveOrder(buildUnifiedOrderWith({ entityId: 6696, company: { entityId: companyId, name: faker.company.name() }, placedBy: { entityId: faker.number.int({ min: 1, max: 99999 }), firstName: faker.person.firstName(), lastName: faker.person.lastName(), email: faker.internet.email() }, invoice: { entityId } }))`; `const view = await renderOrderDetails(b2bBuyerState)`; click `await screen.findByRole('button', { name: /view invoice/i })` with `userEvent`; `expect(view.navigation).toHaveBeenCalledWith(`/invoice?invoiceId=${entityId}`)`.

- [ ] **Step 4: Run to verify both fail.** `yarn vitest run src/pages/OrderDetail/index.unified.test.tsx -t "B2B-6193"`. Expected: the query test fails on the `invoice { id }` assertion; the navigation test fails with `/invoice?invoiceId=NaN`.

- [ ] **Step 5: Implement.** In `orders.ts`: `OrderInvoice` becomes `{ entityId: number }` and the fragment's `invoice { id }` becomes `invoice { entityId }`. In `convertOrderDetail.ts:513`: `invoiceId: order.invoice ? order.invoice.entityId : 0`.

- [ ] **Step 6: Run to verify pass, then type-check.** Re-run the Step 4 command (2 pass), then `yarn tsc --noEmit` (no errors; the three `invoice: null` mocks should need no edits, and if tsc says otherwise, update only the mock shape it names).

- [ ] **Step 7: Commit.** Stage the three source/test files, commit `feat(orders): B2B-6193 read invoice entityId in order detail`.

### Task 2: Pin unchanged behavior for orders without a usable invoice

**Files:**
- Test: `apps/storefront/src/pages/OrderDetail/index.unified.test.tsx` (inside the Task 1 `describe`)

**Interfaces:**
- Consumes: `renderOrderDetails(state?)`, `serveOrder(order)`, `b2bBuyerState`, `buyerEmail`, `companyId` from Task 1.

These are characterization tests, so they are expected to pass on first run. Each starts by awaiting `screen.findByRole('heading', { name: /Order #6696/ })` so a "not present" assertion can't pass against an unrendered page.

- [ ] **Step 1: Write the four tests** (names and assertions):
  - `it('hides view invoice on an order without an invoice that the user did not place')`: `invoice: null`, `placedBy.email: faker.internet.email()`, B2B state; `expect(screen.queryByRole('button', { name: /view invoice/i })).not.toBeInTheDocument()`.
  - `it('hides view invoice when the user cannot view invoices')`: invoiced order, B2B state with `permissions: []`; same absence assertion.
  - `it('offers print invoice instead of view invoice to a non-B2B user')`: invoiced order, default (B2C) `preloadedState`; `getByRole('button', { name: /print invoice/i })` is in the document and `queryByRole('button', { name: /view invoice/i })` is not.
  - `it('does not open the invoice page for an order without an invoice that the user placed')`: `invoice: null`, `placedBy.email: buyerEmail`, B2B state; click the "view invoice" button; `expect(view.navigation).not.toHaveBeenCalledWith(expect.stringContaining('/invoice?invoiceId='))`. If jsdom logs a not-implemented `window.open` error from the print path, stub it with `vi.spyOn(window, 'open').mockImplementation(() => null)`.

- [ ] **Step 2: Run.** `yarn vitest run src/pages/OrderDetail/index.unified.test.tsx -t "B2B-6193"`. Expected: all 6 pass. If a B2B render hangs on an unmocked request, add an MSW handler for exactly that request in this `describe`'s setup (no global handlers).

- [ ] **Step 3: Commit** `test(orders): B2B-6193 pin View Invoice behavior for orders without a usable invoice`.

### Task 3: Verify and prepare the draft PR

**Files:** none modified.

- [ ] **Step 1: Run the order-related suites.** `yarn vitest run src/pages/OrderDetail src/pages/order src/pages/MyOrders src/pages/CompanyOrderList`. Expected: all pass.
- [ ] **Step 2: Lint and types.** `yarn lint` and `yarn tsc --noEmit`. Expected: no errors and no new ESLint disables.
- [ ] **Step 3: Stop and ask the user** before pushing or opening a PR. When they say go, use the `create-pr` skill with a draft PR whose description states the merge gate ("Do not merge until bigcommerce/storefront #6351 is deployed to the target environment; then confirm a real `GetOrderDetail` selecting `invoice { entityId }` succeeds for an invoiced order").

### Task 4: Local screenshot mocks (local only, never pushed)

**Files (on a throwaway branch):**
- Modify: `apps/storefront/src/hooks/useFeatureFlag.ts`
- Modify: `apps/storefront/src/shared/service/bc/graphql/orders.ts` (`getOrderDetail`, ~line 741)

The existing `local/screenshot-mocks` branch is stale (tip is feature work, no dev-only mock guards, no `GetOrderDetail` mock), so leave it untouched.

- [ ] **Step 1:** `git switch -c local/screenshot-mocks-b2b-6193 B2B-6193`.
- [ ] **Step 2:** In `useFeatureFlag.ts`, when `process.env.NODE_ENV === 'development'` and `flagKey === 'B2B-4613.buyer_portal_unified_sf_gql_orders'`, return `true`.
- [ ] **Step 3:** In `getOrderDetail`, when `process.env.NODE_ENV === 'development'`, return a plain-valued `GetOrderDetailResponse` before the real request: same shape as `buildUnifiedOrderWith` (test file lines 88-130) with `invoice: { entityId: 4242 }`, `company.entityId` and `placedBy.email` matching the logged-in B2B buyer.
- [ ] **Step 4:** Run `yarn dev`, log in as a B2B buyer with the invoice permission, open an order, and confirm View Invoice shows and navigates to `/invoice?invoiceId=4242`. Hand the user the running app to take screenshots.
- [ ] **Step 5:** Commit locally as `chore(orders): B2B-6193 local screenshot mocks (do not push)`, then `git switch B2B-6193`. Never push or merge this branch.
