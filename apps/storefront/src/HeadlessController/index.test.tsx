import {
  buildCompanyStateWith,
  builder,
  faker,
  graphql,
  HttpResponse,
  renderWithProviders,
  startMockServer,
  stringContainingAll,
} from 'tests/test-utils';
import { when } from 'vitest-when';

import { ShoppingListsItemsProps } from '@/pages/ShoppingLists/config';
import { CustomerRole } from '@/types';
import { BigCommerceStorefrontAPIBaseURL } from '@/utils/basicConfig';

import HeadlessController from '.';

const { server } = startMockServer();

const buildShoppingListsNodeWith = builder<{ node: ShoppingListsItemsProps }>(() => ({
  node: {
    id: faker.number.int({ max: 1000 }),
    name: faker.word.words({ count: 1 }),
    description: faker.word.words(),
    status: faker.number.int({ multipleOf: 10, max: 50 }),
    channelId: faker.number.int(),
    customerInfo: {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      userId: faker.number.int(),
      email: faker.internet.email(),
      role: faker.word.words(),
    },
    products: {
      totalCount: faker.number.int(),
    },
    updatedAt: faker.date.anytime().toString(),
    approvedFlag: faker.datatype.boolean(),
    isOwner: faker.datatype.boolean(),
    companyInfo: {
      companyId: faker.number.int().toString(),
      companyName: faker.company.name(),
      companyAddress: faker.location.streetAddress(),
      companyCountry: faker.location.country(),
      companyState: faker.location.state(),
      companyCity: faker.location.city(),
      companyZipCode: faker.location.zipCode(),
      phoneNumber: faker.number.int().toString(),
      bcId: faker.number.int().toString(),
    },
  },
}));

describe('HeadlessController user.logout', () => {
  const bcGraphql = graphql.link(`${BigCommerceStorefrontAPIBaseURL}/graphql`);
  const b2bGraphql = graphql.link('https://api-b2b.bigcommerce.com/graphql');

  it('calls the BC logout mutation to clear the storefront session cookie', async () => {
    const logoutMutation = vi.fn().mockReturnValue({ data: { logout: { result: 'success' } } });

    server.use(
      bcGraphql.mutation('Logout', () => HttpResponse.json(logoutMutation())),
      b2bGraphql.mutation('storeFrontToken', () =>
        HttpResponse.json({ data: { storeFrontToken: { token: faker.string.uuid() } } }),
      ),
    );

    const mockSetOpenPage = vi.fn();
    renderWithProviders(<HeadlessController setOpenPage={mockSetOpenPage} />);

    await window.b2b.utils.user.logout();

    expect(logoutMutation).toHaveBeenCalled();
  });

  it('prefetches a bcGraphqlToken before calling the BC logout mutation when none is cached', async () => {
    const freshToken = faker.string.uuid();
    const logoutAuthHeaders: (string | null)[] = [];

    server.use(
      bcGraphql.mutation('Logout', ({ request }) => {
        logoutAuthHeaders.push(request.headers.get('Authorization'));
        return HttpResponse.json({ data: { logout: { result: 'success' } } });
      }),
      b2bGraphql.mutation('storeFrontToken', () =>
        HttpResponse.json({ data: { storeFrontToken: { token: freshToken } } }),
      ),
    );

    const mockSetOpenPage = vi.fn();
    // Default preloaded state has an empty bcGraphqlToken, simulating a cleared/expired
    // token before logout runs.
    renderWithProviders(<HeadlessController setOpenPage={mockSetOpenPage} />);

    await window.b2b.utils.user.logout();

    expect(logoutAuthHeaders).toEqual([`Bearer  ${freshToken}`]);
  });
});

describe('HeadlessController shopping lists utils', () => {
  it('getLists retrieves B2B shopping lists', async () => {
    const getShoppingLists = vi.fn();

    when(getShoppingLists)
      .calledWith(stringContainingAll('first: 50', 'offset: 0'))
      .thenReturn({
        data: {
          shoppingLists: {
            totalCount: 1,
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
            },
            edges: [
              buildShoppingListsNodeWith({
                node: {
                  id: 123,
                },
              }),
            ],
          },
        },
      });

    server.use(
      graphql.query('B2BCustomerShoppingLists', ({ query }) =>
        HttpResponse.json(getShoppingLists(query)),
      ),
    );

    const mockSetOpenPage = vi.fn();
    renderWithProviders(<HeadlessController setOpenPage={mockSetOpenPage} />, {
      preloadedState: {
        company: buildCompanyStateWith({
          customer: {
            role: CustomerRole.SUPER_ADMIN,
          },
        }),
      },
    });

    const data = await window.b2b.utils.shoppingList.getLists();

    expect(data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 123,
        }),
      ]),
    );
  });

  it('getLists retrieves B2C shopping lists', async () => {
    const getShoppingLists = vi.fn();

    when(getShoppingLists)
      .calledWith(stringContainingAll('first: 50', 'offset: 0'))
      .thenReturn({
        data: {
          customerShoppingLists: {
            totalCount: 1,
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
            },
            edges: [
              buildShoppingListsNodeWith({
                node: {
                  id: 123,
                },
              }),
            ],
          },
        },
      });

    server.use(
      graphql.query('CustomerShoppingLists', ({ query }) =>
        HttpResponse.json(getShoppingLists(query)),
      ),
    );

    const mockSetOpenPage = vi.fn();
    renderWithProviders(<HeadlessController setOpenPage={mockSetOpenPage} />);
    const data = await window.b2b.utils.shoppingList.getLists();

    expect(data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 123,
        }),
      ]),
    );
  });
});
