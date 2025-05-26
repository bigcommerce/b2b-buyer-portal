import {
  buildCompanyStateWith,
  builder,
  buildGlobalStateWith,
  faker,
  renderWithProviders,
  screen,
  userEvent,
  waitForElementToBeRemoved,
} from 'tests/test-utils';

import * as graphqlModule from '@/shared/service/b2b';
import { Customer, CustomerRole, LoginTypes, ShoppingListStatus, UserTypes } from '@/types';
import { globalSnackbar } from '@/utils/b3Tip';

import PDP from '.';

const buildCustomerWith = builder<Customer>(() => ({
  id: faker.number.int(),
  phoneNumber: faker.phone.number(),
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  emailAddress: faker.internet.email(),
  customerGroupId: faker.number.int(),
  role: faker.helpers.arrayElement([
    CustomerRole.SUPER_ADMIN,
    CustomerRole.ADMIN,
    CustomerRole.B2C,
    CustomerRole.JUNIOR_BUYER,
  ]),
  userType: faker.helpers.arrayElement([
    UserTypes.B2B_SUPER_ADMIN,
    UserTypes.B2C,
    UserTypes.CURRENT_B2B_COMPANY,
  ]),
  loginType: faker.helpers.arrayElement([
    LoginTypes.FIRST_LOGIN,
    LoginTypes.GENERAL_LOGIN,
    LoginTypes.WAITING_LOGIN,
  ]),
  companyRoleName: faker.lorem.word(),
}));

const buildShoppingListGraphQLResponseNodeWith = builder(() => ({
  id: faker.string.uuid(),
  name: faker.lorem.words(),
  description: faker.lorem.words(),
  status: faker.helpers.arrayElement([
    ShoppingListStatus.Approved,
    ShoppingListStatus.Deleted,
    ShoppingListStatus.Draft,
    ShoppingListStatus.ReadyForApproval,
    ShoppingListStatus.Rejected,
  ]),
  customerInfo: {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    userId: faker.number.int(),
    email: faker.internet.email(),
    role: faker.helpers.arrayElement([
      CustomerRole.SUPER_ADMIN,
      CustomerRole.ADMIN,
      CustomerRole.B2C,
      CustomerRole.JUNIOR_BUYER,
    ]),
  },
  updatedAt: faker.date.past(),
  isOwner: faker.datatype.boolean(),
  products: { totalCount: faker.number.int() },
  approvedFlag: faker.datatype.boolean(),
  companyInfo: {
    companyId: faker.string.uuid(),
    companyName: faker.company.name(),
    companyAddress: faker.location.streetAddress(),
    companyCountry: faker.location.country(),
    companyState: faker.location.state(),
    companyCity: faker.location.city(),
    companyZipCode: faker.location.zipCode(),
    phoneNumber: faker.phone.number(),
    bcId: faker.string.uuid(),
  },
}));

describe('when a product without a required variant is added to a shopping list', () => {
  it('triggers an error alert that indicates the product is missing required variant', async () => {
    window.b2b = {
      ...window.b2b,
      utils: {
        ...window.b2b?.utils,
        shoppingList: {
          ...window.b2b?.utils?.shoppingList,
          itemFromCurrentPage: [
            {
              productId: 123,
              selectedOptions: { 'attribute 1': 2 },
              quantity: 1,
              productEntityId: 234,
              optionSelections: { 'attribute 1': 2 },
            },
          ],
        },
      },
    };

    const globalState = buildGlobalStateWith({
      storeInfo: {
        platform: 'others',
      },
    });

    const superAdminCustomer = buildCustomerWith({
      role: CustomerRole.SUPER_ADMIN,
    });

    const companyStateWithSuperAdminUser = buildCompanyStateWith({
      customer: superAdminCustomer,
      permissions: [{ code: 'submit_shopping_list_for_approval', permissionLevel: 1 }],
    });

    const shoppingList = buildShoppingListGraphQLResponseNodeWith({
      name: 'Test Shopping List 1',
      status: ShoppingListStatus.Draft,
    });

    const shoppingListResponse = {
      totalCount: 1,
      pageInfo: { hasNextPage: false, hasPreviousPage: false },
      edges: [
        {
          node: shoppingList,
        },
      ],
    };

    const productsResponse = {
      productsSearch: [
        {
          id: 114,
          name: 'Product with variant',
          sku: 'test-1',
          variants: [
            {
              variant_id: 179,
              product_id: 114,
              sku: 'test-1-1',
              option_values: [
                {
                  id: 103,
                  label: 'Silver',
                  option_id: 114,
                  option_display_name: 'Color',
                },
              ],
            },
            {
              variant_id: 180,
              product_id: 114,
              sku: 'test-1-2',
              option_values: [
                {
                  id: 104,
                  label: 'Black',
                  option_id: 114,
                  option_display_name: 'Color',
                },
              ],
            },
          ],
          imageUrl: '',
          modifiers: [],
          options: [
            {
              option_id: 114,
              display_name: 'Color',
              sort_order: 0,
              is_required: true,
            },
          ],
          optionsV3: [
            {
              id: 114,
              product_id: 114,
              name: 'Color1742885038-114',
              display_name: 'Color',
              option_values: [
                {
                  id: 103,
                  label: 'Silver',
                  sort_order: 0,
                  is_default: false,
                },
                {
                  id: 104,
                  label: 'Black',
                  sort_order: 1,
                  is_default: false,
                },
              ],
              config: [],
            },
          ],
          channelId: [],
          productUrl: '',
        },
      ],
    };

    vi.spyOn(graphqlModule, 'getB2BShoppingList').mockResolvedValue(shoppingListResponse);
    vi.spyOn(graphqlModule, 'searchB2BProducts').mockResolvedValue(productsResponse);

    vi.mock('@/utils/b3Tip', () => ({
      globalSnackbar: {
        error: vi.fn(),
        success: vi.fn(),
      },
    }));

    renderWithProviders(<PDP />, {
      preloadedState: {
        global: globalState,
        company: companyStateWithSuperAdminUser,
      },
    });

    await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

    expect(screen.getByText('Add to shopping list')).toBeInTheDocument();

    await userEvent.click(screen.getByText('Test Shopping List 1'));
    await userEvent.click(screen.getByText('OK'));

    expect(globalSnackbar.error).toHaveBeenCalledWith('Please fill out product options first.', {
      isClose: true,
    });

    expect(globalSnackbar.success).not.toHaveBeenCalled();
  });
});

describe('when a product with required variants is added to a shopping list', () => {
  it('triggers an alert that indicates the product is added to the shopping list', async () => {
    window.b2b = {
      ...window.b2b,
      utils: {
        ...window.b2b?.utils,
        shoppingList: {
          ...window.b2b?.utils?.shoppingList,
          itemFromCurrentPage: [
            {
              productId: 123,
              selectedOptions: { 'attribute[114]': 104 },
              quantity: 1,
              productEntityId: 234,
              optionSelections: { 'attribute[114]': 104 },
            },
          ],
        },
      },
    };

    const globalState = buildGlobalStateWith({
      storeInfo: {
        platform: 'others',
      },
    });

    const superAdminCustomer = buildCustomerWith({
      role: CustomerRole.SUPER_ADMIN,
    });

    const companyStateWithSuperAdminUser = buildCompanyStateWith({
      customer: superAdminCustomer,
      permissions: [{ code: 'submit_shopping_list_for_approval', permissionLevel: 1 }],
    });

    const shoppingList = buildShoppingListGraphQLResponseNodeWith({
      name: 'Test Shopping List 1',
      status: ShoppingListStatus.Draft,
    });

    const shoppingListResponse = {
      totalCount: 1,
      pageInfo: { hasNextPage: false, hasPreviousPage: false },
      edges: [
        {
          node: shoppingList,
        },
      ],
    };

    const productsResponse = {
      productsSearch: [
        {
          id: 114,
          name: 'Product with variant',
          sku: 'test-1',
          variants: [
            {
              variant_id: 179,
              product_id: 114,
              sku: 'test-1-1',
              option_values: [
                {
                  id: 103,
                  label: 'Silver',
                  option_id: 114,
                  option_display_name: 'Color',
                },
              ],
            },
            {
              variant_id: 180,
              product_id: 114,
              sku: 'test-1-2',
              option_values: [
                {
                  id: 104,
                  label: 'Black',
                  option_id: 114,
                  option_display_name: 'Color',
                },
              ],
            },
          ],
          imageUrl: '',
          modifiers: [],
          options: [
            {
              option_id: 114,
              display_name: 'Color',
              sort_order: 0,
              is_required: true,
            },
          ],
          optionsV3: [
            {
              id: 114,
              product_id: 114,
              name: 'Color1742885038-114',
              display_name: 'Color',
              option_values: [
                {
                  id: 103,
                  label: 'Silver',
                  sort_order: 0,
                  is_default: false,
                },
                {
                  id: 104,
                  label: 'Black',
                  sort_order: 1,
                  is_default: false,
                },
              ],
              config: [],
            },
          ],
          channelId: [],
          productUrl: '',
        },
      ],
    };

    const addProductToShoppingListResponse = {
      data: {
        shoppingListsItemsCreate: {
          shoppingListsItems: [
            {
              id: '12',
            },
          ],
        },
      },
    };

    vi.spyOn(graphqlModule, 'getB2BShoppingList').mockResolvedValue(shoppingListResponse);
    vi.spyOn(graphqlModule, 'searchB2BProducts').mockResolvedValue(productsResponse);
    vi.spyOn(graphqlModule, 'addProductToShoppingList').mockResolvedValue(
      addProductToShoppingListResponse,
    );

    vi.mock('@/utils/b3Tip', () => ({
      globalSnackbar: {
        error: vi.fn(),
        success: vi.fn(),
      },
    }));

    renderWithProviders(<PDP />, {
      preloadedState: {
        global: globalState,
        company: companyStateWithSuperAdminUser,
      },
    });

    await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

    expect(screen.getByText('Add to shopping list')).toBeInTheDocument();

    await userEvent.click(screen.getByText('Test Shopping List 1'));
    await userEvent.click(screen.getByText('OK'));

    expect(globalSnackbar.error).not.toHaveBeenCalled();
    expect(globalSnackbar.success).toHaveBeenCalledWith(
      'Products were added to your shopping list',
      expect.anything(),
    );
  });
});

describe('when an unexpected error occurred during adding a product to shopping list', () => {
  it('triggers an error alert that indicates something went wrong', async () => {
    window.b2b = {
      ...window.b2b,
      utils: {
        ...window.b2b?.utils,
        shoppingList: {
          ...window.b2b?.utils?.shoppingList,
          itemFromCurrentPage: [
            {
              productId: 123,
              selectedOptions: { 'attribute[114]': 104 },
              quantity: 1,
              productEntityId: 234,
              optionSelections: { 'attribute[114]': 104 },
            },
          ],
        },
      },
    };

    const globalState = buildGlobalStateWith({
      storeInfo: {
        platform: 'others',
      },
    });

    const superAdminCustomer = buildCustomerWith({
      role: CustomerRole.SUPER_ADMIN,
    });

    const companyStateWithSuperAdminUser = buildCompanyStateWith({
      customer: superAdminCustomer,
      permissions: [{ code: 'submit_shopping_list_for_approval', permissionLevel: 1 }],
    });

    const shoppingList = buildShoppingListGraphQLResponseNodeWith({
      name: 'Test Shopping List 1',
      status: ShoppingListStatus.Draft,
    });

    const shoppingListResponse = {
      totalCount: 1,
      pageInfo: { hasNextPage: false, hasPreviousPage: false },
      edges: [
        {
          node: shoppingList,
        },
      ],
    };

    const productsResponse = {
      productsSearch: [
        {
          id: 114,
          name: 'Product with variant',
          sku: 'test-1',
          variants: [
            {
              variant_id: 179,
              product_id: 114,
              sku: 'test-1-1',
              option_values: [
                {
                  id: 103,
                  label: 'Silver',
                  option_id: 114,
                  option_display_name: 'Color',
                },
              ],
            },
            {
              variant_id: 180,
              product_id: 114,
              sku: 'test-1-2',
              option_values: [
                {
                  id: 104,
                  label: 'Black',
                  option_id: 114,
                  option_display_name: 'Color',
                },
              ],
            },
          ],
          imageUrl: '',
          modifiers: [],
          options: [
            {
              option_id: 114,
              display_name: 'Color',
              sort_order: 0,
              is_required: true,
            },
          ],
          optionsV3: [
            {
              id: 114,
              product_id: 114,
              name: 'Color1742885038-114',
              display_name: 'Color',
              option_values: [
                {
                  id: 103,
                  label: 'Silver',
                  sort_order: 0,
                  is_default: false,
                },
                {
                  id: 104,
                  label: 'Black',
                  sort_order: 1,
                  is_default: false,
                },
              ],
              config: [],
            },
          ],
          channelId: [],
          productUrl: '',
        },
      ],
    };

    vi.spyOn(graphqlModule, 'getB2BShoppingList').mockResolvedValue(shoppingListResponse);
    vi.spyOn(graphqlModule, 'searchB2BProducts').mockResolvedValue(productsResponse);
    vi.spyOn(graphqlModule, 'addProductToShoppingList').mockRejectedValue(
      new Error('Unexpected error'),
    );

    vi.mock('@/utils/b3Tip', () => ({
      globalSnackbar: {
        error: vi.fn(),
        success: vi.fn(),
      },
    }));

    renderWithProviders(<PDP />, {
      preloadedState: {
        global: globalState,
        company: companyStateWithSuperAdminUser,
      },
    });

    await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

    expect(screen.getByText('Add to shopping list')).toBeInTheDocument();

    await userEvent.click(screen.getByText('Test Shopping List 1'));
    await userEvent.click(screen.getByText('OK'));

    expect(globalSnackbar.error).toHaveBeenCalledWith('Something went wrong. Please try again.', {
      isClose: true,
    });
  });
});
