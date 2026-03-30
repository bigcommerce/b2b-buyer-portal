# AI Agent Guide: B2B Buyer Portal

> **Purpose**: This document serves as a comprehensive guide for AI coding agents and developers working with the B2B Buyer Portal codebase. It explains architectural patterns, testing practices, and critical workflows.

---

## 📋 Table of Contents

- [Project Overview](#-project-overview)
- [Critical: Working Directory Rules](#️-critical-working-directory-rules)
- [Architecture Philosophy & Patterns](#-architecture-philosophy--patterns)
- [Development Commands](#-development-commands)
- [File Structure Patterns](#-file-structure-patterns)
- [Testing Guidelines](#-testing-guidelines)
- [Import Rules & Path Aliases](#-import-rules--path-aliases)
- [Code Generation](#-code-generation)
- [Common Pitfalls & Anti-Patterns](#-common-pitfalls--anti-patterns)
- [Redux State (Legacy - Use Sparingly)](#-redux-state-legacy---use-sparingly)
- [Key Configuration Files](#-key-configuration-files)
- [Pull Request Guidelines](#-pull-request-guidelines)
- [Component Structure Examples](#-component-structure-examples)
- [Testing Environment Setup](#-testing-environment-setup)
- [Quick Reference: Testing Checklist](#-quick-reference-testing-checklist)

---

## 🎯 Project Overview

**B2B Buyer Portal** is a React-based frontend application for BigCommerce's B2B Edition buyer experience.

### Tech Stack

- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Testing**: Vitest + Testing Library
- **State Management**: Redux Toolkit (legacy, minimizing use)
- **Styling**: Material-UI (MUI) + Emotion
- **Monorepo**: Turborepo (single package structure)

### Project Structure

```
b2b-buyer-portal-app/
├── apps/
│   └── storefront/              ← Main application (work here!)
│       ├── src/                 ← Source code
│       ├── tests/               ← Test utilities & builders
│       ├── vite.config.ts       ← Build & test config
│       └── package.json         ← Dependencies & scripts
├── config/                      ← Deployment configs
├── docs/                        ← Documentation
└── rfc/                         ← RFCs & GraphQL schemas
```

### Current State

⚠️ **The codebase is undergoing architectural improvements**. Legacy patterns exist but **should not be replicated** in new code. Always follow the [Target Architecture](#target-architecture-use-this) patterns outlined below.

---

## ⚠️ Critical: Working Directory Rules

### **ALL commands MUST be run from `apps/storefront/`**

```bash
# Navigate to the correct directory first
cd apps/storefront

# Then run commands
yarn dev
yarn test
yarn build
```

### Why This Matters

This project uses Turborepo as a monorepo structure, even though it currently contains only one package (`storefront`). All package dependencies, scripts, and configurations are defined at the `apps/storefront/` level, not at the root.

**Running commands from the wrong directory will cause:**
- ❌ Commands not found
- ❌ Wrong dependencies loaded
- ❌ Incorrect build outputs
- ❌ Test failures

---

## 🏛 Architecture Philosophy & Patterns

### Target Architecture (Use This)

When writing new code, follow these principles:

#### 1. **Matroska-Style Structure**
Each component/page owns its domain-specific dependencies. Group related files together.

```
src/pages/Invoice/
├── index.tsx                    # Main component
├── index.test.tsx               # Tests
├── InvoiceHeader.tsx            # Page-specific component
├── InvoicePayments/             # More complex sub-component
│   ├── index.tsx
│   └── usePaymentHistory.ts     # Component-specific hook
└── hooks/
    └── useInvoiceData.ts        # Page-specific hook
```

#### 2. **Prefer Props Over Context/Redux**
Pass data through component props whenever possible. This makes data flow explicit and components more testable.

```typescript
// ✅ GOOD: Explicit props
interface Props {
  orderId: string;
  customerId: string;
}

function OrderDetails({ orderId, customerId }: Props) {
  // ...
}

// ❌ BAD: Hidden dependencies
function OrderDetails() {
  const orderId = useAppSelector(state => state.order.id);
  const customerId = useContext(CustomerContext);
  // ...
}
```

#### 3. **Co-located Files**
Keep related files together. Tests live next to the code they test.

```
InvoiceList/
├── index.tsx              # Component
├── index.test.tsx         # Desktop tests
├── index.mobile.test.tsx  # Mobile-specific tests
└── useInvoiceFilters.ts   # Component-specific logic
```

#### 4. **URL-Driven State**
Use route parameters and query strings for state that should persist across page loads.

```typescript
// ✅ GOOD: State in URL
function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;
  const category = searchParams.get('category') || 'all';
  
  return (
    <button onClick={() => setSearchParams({ page: page + 1, category })}>
      Next Page
    </button>
  );
}

// ❌ BAD: Hidden state
function ProductList() {
  const [page, setPage] = useState(1);
  const category = useAppSelector(state => state.filters.category);
  // State lost on refresh!
}
```

#### 5. **Local Component State**
Use React hooks (`useState`, `useReducer`) for component-specific state.

```typescript
function InvoiceForm() {
  const [formData, setFormData] = useState({ amount: '', note: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  // ...
}
```

#### 6. **Domain-Agnostic Helpers Only**
Shared utilities (`src/utils/`, `src/hooks/`) should contain pure functions with no business logic.

```typescript
// ✅ GOOD: Pure utility
export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency 
  }).format(amount);
}

// ❌ BAD: Business logic in utility
export function getInvoiceTotal(invoice: Invoice): number {
  // This belongs in the Invoice domain, not shared utils
  return invoice.items.reduce((sum, item) => sum + item.price, 0);
}
```

---

### Legacy Patterns (Avoid These)

The codebase contains these patterns, but **do not add more**:

❌ **DO NOT** add new React Context providers  
❌ **DO NOT** store state in Redux unless absolutely necessary  
❌ **DO NOT** use `localStorage` or `sessionStorage` for state  
❌ **DO NOT** create global contexts like `GlobalContext`, `DynamicallyVariableContext`, or `CustomStyleContext`

**Why avoid these?**
- Hidden dependencies make code harder to understand
- Difficult to test in isolation
- Unclear data flow
- State synchronization bugs
- Performance issues from unnecessary re-renders

---

## 🛠 Development Commands

All commands must be run from `apps/storefront/`:

| Command                  | Description                | Use When                |
| ------------------------ | -------------------------- | ----------------------- |
| `yarn dev`               | Start development server   | Local development       |
| `yarn build`             | Build for production       | Pre-deployment          |
| `yarn tsc --noEmit`      | Type checking only         | Quick type validation   |
| `yarn lint`              | Run all linters            | Before committing       |
| `yarn lint:eslint`       | ESLint only                | Fix code style issues   |
| `yarn lint:dependencies` | Dependency validation      | Check import rules      |
| `yarn lint:knip`         | Unused code detection      | Find dead code          |
| `yarn format`            | Auto-fix linting issues    | Fix auto-fixable errors |
| `yarn test`              | Run tests (watch mode)     | During development      |
| `yarn test <filename>`   | Run specific test file     | Test single file        |
| `yarn coverage`          | Test coverage report       | Check test coverage     |
| `yarn generate`          | Generate GraphQL types     | After schema changes    |
| `yarn generate:local`    | Generate types (local env) | Local development       |

### Example Workflow

```bash
cd apps/storefront

# Start development
yarn dev

# In another terminal, run tests in watch mode
yarn test

# Before committing
yarn lint
yarn tsc --noEmit
```

---

## 📁 File Structure Patterns

### Pages Structure

```
src/pages/[PageName]/
├── index.tsx                   # Main page component
├── index.test.tsx              # Desktop tests
├── index.mobile.test.tsx       # Mobile-specific tests (if needed)
├── [Component].tsx             # Simple page-specific component
├── [Component]/                # Complex page-specific component
│   ├── index.tsx               # Component entry point
│   ├── [Component].test.tsx    # Component tests
│   ├── [SubComponent].tsx      # Child component
│   └── use[Hook].ts            # Component-specific hook
└── hooks/                      # Page-specific hooks
    └── use[Hook].ts
```

### Shared Code Structure

> ⚠️ **We are removing the B3/B2/B2B prefixes** Prefer clean, semantic names.

```
src/
├── components/                 # Shared UI components (domain-agnostic)
│   ├── Card.tsx
│   ├── Dialog.tsx
│   └── button/
│       ├── index.tsx
│       └── Button.test.tsx
├── hooks/                      # Shared hooks (domain-agnostic)
│   ├── useDebounce.ts
│   └── useFeatureFlag.ts
├── utils/                      # Pure utility functions
│   ├── formatters.ts
│   └── validators.ts
├── types/                      # TypeScript type definitions
│   └── invoice.ts
└── store/                      # Redux store (legacy - minimize use)
    ├── index.ts
    └── slices/
```

### Key Principles

1. **Page-specific code stays with the page** - Don't move components to `src/components/` unless they're truly reusable and domain agnostic
2. **Tests live next to code** - `Component.tsx` → `Component.test.tsx`
3. **Test from a use-case point of view** - For pages, focus on integration tests that cover user workflows. Add component-level tests only for reusable components.
4. **Hooks live with their users** - Page-specific hooks go in `pages/[Page]/hooks/`
5. **Shared code must be domain-agnostic** - No business logic in `src/components/` or `src/utils/`
6. **Resolve feature flags and conditions at the highest level possible** - Then pass explicit props down to focused components.

---

## 🧪 Testing Guidelines

### Test File Conventions

- **Co-locate tests**: `index.tsx` → `index.test.tsx`
- **Mobile variants**: `index.tsx` → `index.mobile.test.tsx`
- **Test from user's perspective**: Write tests based on what users see and do, not implementation details

### Key Testing Utilities

Import from `tests/test-utils.tsx`:

```typescript
import {
  renderWithProviders,      // Render components with Redux/Router
  screen,                    // Query rendered elements
  userEvent,                 // Simulate user interactions
  waitFor,                   // Async assertions
  waitForElementToBeRemoved, // Wait for loading states
  within,                    // Scope queries to a container
  faker,                     // Generate fake data
  builder,                   // Build test objects
  bulk,                      // Build multiple test objects
  graphql,                   // Mock GraphQL requests
  http,                      // Mock HTTP requests
  HttpResponse,              // Create mock responses
  startMockServer,           // Start MSW server
  stringContainingAll,       // Assert multiple substrings
} from 'tests/test-utils';
```

For hook testing: (hooks should rarely be tested in isolation)

```typescript
import { renderHookWithProviders } from 'tests/utils/hook-test-utils';
```

---

### Test Data Builders

**Always use builders** - never hardcode test data.

#### Basic Builder Pattern

```typescript
import { builder, bulk, faker } from 'tests/test-utils';

// Define a builder
const buildInvoiceWith = builder(() => ({
  id: faker.number.int().toString(),
  invoiceNumber: faker.number.int().toString(),
  amount: faker.commerce.price(),
  status: faker.helpers.enumValue(InvoiceStatus),
  dueDate: faker.date.future(),
}));

// Use it in tests
const invoice = buildInvoiceWith({ status: 'PAID' });
// Use 'WHATEVER_VALUES' to explicitly indicate "any values will do"
const invoices = bulk(buildInvoiceWith, 'WHATEVER_VALUES').times(5);
```

**Key Points:**
- `builder()` creates a factory function that generates random test data
- Override specific properties by passing an object: `buildInvoiceWith({ status: 'PAID' })`
- `bulk()` generates multiple items: `bulk(buildInvoiceWith, 'WHATEVER_VALUES').times(5)`
- Use `'WHATEVER_VALUES'` as a semantic marker when you don't care about specific values
- Pass an object to `bulk()` to override properties for all generated items

#### State Builders

```typescript
import {
  buildCompanyStateWith,
  buildGlobalStateWith,
  buildStoreInfoStateWith,
  buildB2BFeaturesStateWith,
} from 'tests/test-utils';

const loggedInUser = buildCompanyStateWith({ 
  tokens: { B2BToken: faker.string.uuid() },
  customer: { role: CustomerRole.ADMIN }
});

renderWithProviders(<Invoice />, {
  preloadedState: { company: loggedInUser },
});
```

---

### API Mocking with MSW

Use Mock Service Worker (MSW) for API mocking:

```typescript
import { graphql, http, HttpResponse, startMockServer } from 'tests/test-utils';

const { server } = startMockServer();

// Mock GraphQL queries
server.use(
  graphql.query('GetInvoice', () => {
    return HttpResponse.json({ 
      data: { 
        invoice: buildInvoiceWith({ id: '123' })
      } 
    });
  })
);

// Mock REST endpoints
server.use(
  http.get('/api/invoices/:id', ({ params }) => {
    return HttpResponse.json({ 
      id: params.id,
      amount: '100.00'
    });
  })
);
```

---

### Conditional Mocking with vitest-when

Use `vitest-when` for argument-based mock behavior:

```typescript
import { when } from 'vitest-when';

// Mock different returns based on arguments
when(vi.mocked(fetchInvoice))
  .calledWith('invoice-123')
  .thenReturn({ id: 'invoice-123', status: 'PAID' });

when(vi.mocked(fetchInvoice))
  .calledWith('invoice-456')
  .thenReturn({ id: 'invoice-456', status: 'PENDING' });

// Calls return different values
await fetchInvoice('invoice-123'); // { status: 'PAID' }
await fetchInvoice('invoice-456'); // { status: 'PENDING' }
```

**Benefits:**
- Clearer test intentions than `mockImplementation`
- Multiple test scenarios with one mock
- Type-safe conditional behavior

---

### Assertion Helpers

```typescript
import { stringContainingAll } from 'tests/test-utils';

when(getOrders)
    // Assert GraphQL queries contain specific strings
  .calledWith(stringContainingAll(['query', 'GetInvoice', 'invoiceNumber', 'dueDate']))
  .thenReturn({
    orders: [],
  })  
```

---

### Testing Best Practices

#### ✅ DO

- **Use builders for ALL test data** - Never hardcode values
- **Mock external dependencies** - Use MSW for APIs, `vi.mock` for modules
- **Test user behavior** - What users see and do, not implementation
- **Wait for async operations** - Use `waitFor` and `waitForElementToBeRemoved`
- **Scope queries** - Use `within()` for specific containers
- **Descriptive test names** - Clear `describe` and `it` blocks, avoid the use of `should` and make the name use-case focused.

```typescript
// ❌ BAD
it('should display invoice details after loading', ...)
// ✅ GOOD
it('displays invoice details after loading', ...)
```

```typescript
describe('Invoice Page', () => {
  it('displays invoice details after loading', async () => {
    // Arrange
    const invoice = buildInvoiceWith({ status: 'PAID' });
    server.use(
      graphql.query('GetInvoice', () => 
        HttpResponse.json({ data: { invoice } })
      )
    );

    // Act
    renderWithProviders(<InvoicePage />);
    await waitForElementToBeRemoved(() => screen.queryByText('Loading'));

    // Assert
    expect(screen.getByText(invoice.invoiceNumber)).toBeInTheDocument();
    expect(screen.getByText('PAID')).toBeInTheDocument();
  });
});
```

#### ❌ DON'T

- **Hardcode test data** - Always use builders
- **Test implementation details** - Don't test internal state or functions
- **Use `act()` directly** - Testing Library handles it automatically
- **Mock React hooks** - Don't mock `useState`, `useEffect`, etc.

```typescript
// ❌ BAD
it('calls handleSubmit when form is submitted', () => {
  const handleSubmit = vi.fn();
  render(<Form onSubmit={handleSubmit} />);
  // Testing implementation, not user behavior
});

// ✅ GOOD
it('submits invoice payment when user clicks Pay button', async () => {
  const user = userEvent.setup();
  renderWithProviders(<InvoicePayment />);
  
  await user.type(screen.getByLabelText('Amount'), '100');
  await user.click(screen.getByRole('button', { name: 'Pay' }));
  
  await waitFor(() => {
    expect(screen.getByText('Payment successful')).toBeInTheDocument();
  });
});
```

---

### Complete Test Example

From `src/pages/Invoice/index.mobile.test.tsx`:

```typescript
import {
  buildCompanyStateWith,
  builder,
  buildStoreInfoStateWith,
  bulk,
  faker,
  graphql,
  HttpResponse,
  renderWithProviders,
  screen,
  startMockServer,
  waitForElementToBeRemoved,
} from 'tests/test-utils';

const { server } = startMockServer();

const buildInvoiceWith = builder(() => ({
  id: faker.number.int().toString(),
  invoiceNumber: faker.number.int().toString(),
  status: faker.helpers.enumValue(InvoiceStatusCode),
  dueDate: faker.date.future(),
  openBalance: {
    code: faker.finance.currencyCode(),
    value: faker.number.int(),
  },
}));

describe('Invoice Page', () => {
  const loggedInUser = buildCompanyStateWith({ 
    tokens: { B2BToken: faker.string.uuid() } 
  });

  beforeEach(() => {
    window.URL.createObjectURL = vi.fn();
  });

  it('displays invoice details after loading', async () => {
    const invoice = buildInvoiceWith({ status: 'PAID' });
    
    server.use(
      graphql.query('GetInvoice', () => {
        return HttpResponse.json({ data: { invoice } });
      })
    );

    renderWithProviders(<Invoice />, {
      preloadedState: { company: loggedInUser },
      initialEntries: [`/invoice/${invoice.id}`],
    });

    await waitForElementToBeRemoved(() => screen.queryByText('Loading'));
    
    expect(screen.getByText(invoice.invoiceNumber)).toBeInTheDocument();
    expect(screen.getByText('PAID')).toBeInTheDocument();
  });
});
```

---

## 📦 Import Rules & Path Aliases

### Import Rules

Enforced by ESLint - these will cause build failures if violated:

```typescript
// ✅ CORRECT
import { debounce, groupBy } from 'lodash-es';
import { Add, Delete } from '@mui/icons-material';
import { renderWithProviders } from 'tests/test-utils';
import { formatCurrency } from '@/utils/formatters';

// ❌ WRONG - Will fail linting
import debounce from 'lodash/debounce';           // Use lodash-es
import Add from '@mui/icons-material/Add';         // Use named imports
import { formatCurrency } from '../utils/formatters'; // Use path alias
```

### Path Aliases

Configured in `tsconfig.json` and `vite.config.ts`:

| Alias    | Resolves To | Use For          |
| -------- | ----------- | ---------------- |
| `@/`     | `src/`      | Application code |
| `tests/` | `tests/`    | Test utilities   |

```typescript
// ✅ Use path aliases
import { Invoice } from '@/types/invoice';
import { useInvoiceData } from '@/pages/Invoice/hooks/useInvoiceData';
import { buildInvoiceWith } from 'tests/builders/invoiceBuilder';

// ❌ Don't use relative paths for cross-directory imports
import { Invoice } from '../../../types/invoice';
```

---

---

## 🚨 Common Pitfalls & Anti-Patterns

### ESLint Rules to Never Disable

These rules are intentionally disabled project-wide due to legacy code, but **avoid adding more code that violates them**:

| Rule                                 | Why It's Bad                              | What To Do Instead                  |
| ------------------------------------ | ----------------------------------------- | ----------------------------------- |
| `react/jsx-props-no-spreading`       | Spreads hide which props are being passed | Explicitly list props               |
| `@typescript-eslint/no-explicit-any` | Loses type safety                         | Use proper types or `unknown`       |
| `no-console`                         | Console logs in production                | Use proper logging or remove        |
| `react/destructuring-assignment`     | Unclear prop usage                        | Destructure props at function start |

```typescript
// ❌ BAD
function Invoice(props: any) {
  console.log('Rendering invoice', props);
  return <div {...props}>{props.invoice.number}</div>;
}

// ✅ GOOD
function Invoice({ invoice, className, onClose }: InvoiceProps) {
  return (
    <div className={className}>
      <InvoiceHeader invoice={invoice} onClose={onClose} />
      {invoice.number}
    </div>
  );
}
```

---

### State Management Anti-Patterns

⚠️ **The codebase has Redux, but we're minimizing its use.**

**Decision tree for state management:**

1. **Can it go in the URL?** → Use `useSearchParams` or route params
2. **Is it component-specific?** → Use `useState` or `useReducer`
3. **Does parent need it?** → Pass via props (lift state up)
4. **Last resort only** → Use Redux

```typescript
// ✅ PRIORITY 1: URL state
function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;
  const sort = searchParams.get('sort') || 'name';
}

// ✅ PRIORITY 2: Local state
function InvoiceForm() {
  const [formData, setFormData] = useState({ amount: '', note: '' });
  const [errors, setErrors] = useState<ValidationErrors>({});
}

// ✅ PRIORITY 3: Props
function InvoiceList({ customerId, filters }: Props) {
  // Data passed from parent
}

// ❌ AVOID: Redux (use only when absolutely necessary)
function InvoiceList() {
  const invoices = useAppSelector(state => state.invoices.list);
  const dispatch = useAppDispatch();
}
```

---

## 🗄 Redux State (Legacy - Use Sparingly)

### Current Redux Slices

The store contains these slices (avoid adding to them):

| Slice         | Purpose             | Example Data                       |
| ------------- | ------------------- | ---------------------------------- |
| `company`     | User/company info   | Customer ID, company name, role    |
| `b2bFeatures` | Feature flags       | Masquerade mode, enabled features  |
| `global`      | Global UI state     | Messages, loading states           |
| `storeInfo`   | Store configuration | Store ID, currency, tax settings   |
| `lang`        | Translations        | Current locale, translated strings |
| `quoteInfo`   | Quote state         | Current quote, quote items         |

### Accessing Redux State (If You Must)

```typescript
import { useAppSelector, useAppDispatch } from '@/store';

function Component() {
  const dispatch = useAppDispatch();
  const customerId = useAppSelector(({ company }) => company.customer.id);
  const isAdmin = useAppSelector(({ company }) => company.customer.role === 'ADMIN');
  
  // Avoid dispatching actions - use local state instead
  // dispatch(updateInvoice(invoice)); // ❌
}
```

### Preferred Alternative

```typescript
// ✅ Pass data via props from a parent that has access to Redux
function InvoicePage() {
  const customerId = useAppSelector(({ company }) => company.customer.id);
  
  return <InvoiceList customerId={customerId} />;
}

function InvoiceList({ customerId }: { customerId: number }) {
  // No Redux dependency here!
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  
  useEffect(() => {
    fetchInvoices(customerId).then(setInvoices);
  }, [customerId]);
}
```

---

## ⚙️ Key Configuration Files

| File                      | Purpose                     | When to Modify                        |
| ------------------------- | --------------------------- | ------------------------------------- |
| `vite.config.ts`          | Build & test configuration  | Add Vite plugins, change build output |
| `.eslintrc.cjs`           | Linting rules               | Add/modify lint rules (rare)          |
| `tsconfig.json`           | TypeScript configuration    | Add path aliases, compiler options    |
| `.dependency-cruiser.cjs` | Dependency validation rules | Enforce import patterns               |

---

## 📝 Pull Request Guidelines

Based on `CONTRIBUTING.md`:

### Before Creating a PR

1. ✅ All tests pass: `yarn test`
2. ✅ No linting errors: `yarn lint`
3. ✅ Type checking passes: `yarn tsc --noEmit`
4. ✅ Code follows architectural patterns
5. ✅ Tests written using builders
6. ✅ No new ESLint rule disables

### PR Requirements

1. **DO NOT** add new Context providers or Redux state
2. **DO NOT** add code that requires disabling ESLint rules
3. **DO NOT** use `localStorage` or `sessionStorage` for state
4. **DO** store state in URL or local component state
5. **DO** follow the Matroska folder structure
6. **DO** keep levels of abstraction consistent within files
7. **DO NOT** mix UI and business logic concerns
8. **DO NOT** pass hook results (`useB3Lang`, `useState`) into utility functions

### Code Review Focus Areas

- Are new Context providers or Redux actions added? ❌
- Is state stored in URL/local state instead of global state? ✅
- Are tests using builders instead of hardcoded data? ✅
- Are tests co-located with the code they test? ✅
- Are ESLint rules being disabled? ❌
- Is the Matroska structure followed? ✅
- Is code simpler than before? ✅
- Is code clean? ✅
- Are `react-intl` messages using ICU syntax correctly (especially `plural`/`select`), instead of manual patterns like `product(s)`? ✅
- Explicit Props: No hidden dependencies ✅
- Mixed concerns in one component ❌
- Feature flag checks scattered throughout ❌
- Multiple checks for the same conditions ❌
- Are there any types that could be more specific? ❌
- Prefer type guards, explicit checks over type assertions ✅
- Is error handling implemented for all async operations? ✅
- Is `useQuery` used for data fetching instead of manual state management? ✅

---

## 💡 Component Structure Examples

### ❌ BAD (Legacy Pattern)

```typescript
// Storing in context/Redux, global state, hidden dependencies
function InvoiceList() {
  const dispatch = useContext(SomeContext);
  const invoices = useAppSelector(state => state.invoices.list);
  const filters = useContext(FilterContext);
  
  useEffect(() => {
    dispatch(fetchInvoices());
  }, []);
  
  return (
    <div>
      {invoices.map(invoice => (
        <InvoiceCard key={invoice.id} invoice={invoice} />
      ))}
    </div>
  );
}
```

**Problems:**
- Hidden dependencies (Context, Redux)
- Side effects in wrong place
- Hard to test
- Unclear data flow
- State lost on refresh

---

### ✅ GOOD (Target Pattern)

```typescript
// URL-driven, useQuery for data fetching, explicit props
function InvoiceList({ companyId }: { companyId: number }) {
  const [searchParams] = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;
  const status = searchParams.get('status') || 'all';
  
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices', companyId, page, status],
    queryFn: () => fetchInvoices(companyId, { page, status }),
  });
  
  if (isLoading) return <Loading />;
  
  return (
    <div>
      <InvoiceFilters status={status} />
      {invoices.map(invoice => (
        <InvoiceCard key={invoice.id} invoice={invoice} />
      ))}
      <Pagination page={page} />
    </div>
  );
}
```

**Benefits:**
- Explicit dependencies via props
- State in URL (survives refresh)
- Local component state
- `useQuery` handles loading, caching, and error states
- Easy to test
- Clear data flow

---

## 🧩 Testing Environment Setup

Browser APIs are mocked in `tests/setup-test-environment.ts`:

```typescript
// These are set up automatically for all tests
window.URL.createObjectURL = vi.fn();
window.matchMedia = vi.fn().mockImplementation((query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));
```

**If you need additional global mocks**, add them to `tests/setup-test-environment.ts`.

---

## ✅ Quick Reference: Testing Checklist

Use this checklist when writing tests:

- [ ] Test file co-located with source (`Component.tsx` → `Component.test.tsx`)
- [ ] Using builders for **all** test data (no hardcoded values)
- [ ] MSW handlers configured for API calls
- [ ] Testing user behavior, not implementation details
- [ ] Proper async handling (`waitFor`, `waitForElementToBeRemoved`)
- [ ] Descriptive `describe` and `it` blocks
- [ ] Using `within()` for scoped queries when needed
- [ ] No `console.log` statements left in tests
- [ ] Tests run successfully from `apps/storefront/`: `yarn test`

---

## 🎓 Learning Resources

- **Testing Library Docs**: https://testing-library.com/docs/react-testing-library/intro
    - **Common mistakes**: https://kentcdodds.com/blog/common-mistakes-with-react-testing-library
- **Vitest Docs**: https://vitest.dev/
- **MSW Docs**: https://mswjs.io/docs/
- **vitest-when**: https://github.com/mcous/vitest-when
---

## 📞 Questions?

For questions or clarifications:
- Review `CONTRIBUTING.md` for detailed contribution guidelines
- Check existing tests for patterns (`src/pages/Invoice/index.mobile.test.tsx`)
- Create an issue or ask in any of the b2b channels

---

**Last Updated**: November 2025
**Codebase Version**: Transitioning from legacy to modern architecture
