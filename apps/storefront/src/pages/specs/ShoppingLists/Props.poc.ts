// Basic cursor-based pagination wrapper
interface Paginated<T> {
  data: T[];
  pagination: {
    total: number;
  } & ({ hasNext: true; nextCursor: string } | { hasNext: false }) &
    ({ hasPrevious: true; previousCursor: string } | { hasPrevious: false });
}

// Shopping list data required regardless of being Personal/Company or requiring approval
interface BaseShoppingList {
  id: string;
  name: string;
  description: string;
  productCount: number;
  lastUpdated: Date;
}

// The only aspects of a shopping list that can be created on this page
type DraftShoppingList = Pick<BaseShoppingList, 'name' | 'description'>;

type Create = (draftShoppingList: DraftShoppingList) => Promise<void>;

// The only aspects of a shopping list that can be edited on this page
type UpdatedShoppingList = Pick<BaseShoppingList, 'name' | 'description'>;

type Update = (id: string, updatedShoppingList: UpdatedShoppingList) => Promise<void>;

type Delete = (id: string) => Promise<void>;
type Duplicate = (id: string) => Promise<void>;

// Props required required regardless of the shopping lists being Personal/Company or requiring approval
interface BaseProps {
  create: Create;
  delete: Delete;
  duplicate: Duplicate;
  update: Update;
}

// Details that are only required for Personal shopping lists
// eslint-disable-next-line @typescript-eslint/no-namespace
namespace Personal {
  type ShoppingList = BaseShoppingList;

  type FetchShoppingLists = (options: {
    page: number;
    limit: number;
  }) => Promise<Paginated<ShoppingList>>;

  export interface Props extends BaseProps {
    shoppingLists: Paginated<ShoppingList>;
    fetchShoppingLists: FetchShoppingLists;
  }
}

// Details that are only required for Company shopping lists
// eslint-disable-next-line @typescript-eslint/no-namespace
namespace Company {
  interface Creator {
    id: string;
    name: string;
    email: string;
  }

  interface BaseCompanyShoppingList extends BaseShoppingList {
    createdBy: Creator['id'];
    availableActions: { edit: boolean; delete: boolean; duplicate: boolean };
  }

  interface ShoppingListWithPreApproval extends BaseCompanyShoppingList {
    type: 'preApproved';
  }

  interface ShoppingListThatRequiresApproval extends BaseCompanyShoppingList {
    type: 'requiresApproval';
    status: 'draft' | 'readyForApproval' | 'approved' | 'rejected';
  }

  type ShoppingList = ShoppingListWithPreApproval | ShoppingListThatRequiresApproval;

  type FetchShoppingLists = (options: {
    page: number;
    limit: number;
    filters?: { status?: ShoppingListThatRequiresApproval['status']; createdBy?: Creator['id'] };
  }) => Promise<Paginated<ShoppingList>>;

  export interface Props extends BaseProps {
    shoppingLists: Paginated<ShoppingList>;
    fetchShoppingLists: FetchShoppingLists;
    userPermissions: { canCreate: boolean };
    filterOptions: { status: ShoppingListThatRequiresApproval['status'][]; createdBy: Creator[] };
  }
}

// The page fundamentally works in two modes: Personal and Company
export type Props = (Company.Props & { mode: 'company' }) | (Personal.Props & { mode: 'personal' });
