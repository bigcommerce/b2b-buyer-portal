import {
  buildCompanyStateWith,
  builder,
  bulk,
  faker,
  graphql,
  HttpResponse,
  renderWithProviders,
  startMockServer,
  stringContainingAll,
} from 'tests/test-utils';
import { when } from 'vitest-when';

import { ShoppingListsItemsProps } from '@/pages/ShoppingLists/config';

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
      companyId: faker.string.numeric(),
      companyName: faker.company.name(),
      companyAddress: faker.location.streetAddress(),
      companyCountry: faker.location.country(),
      companyState: faker.location.state(),
      companyCity: faker.location.city(),
      companyZipCode: faker.location.zipCode(),
      phoneNumber: faker.string.numeric(),
      bcId: faker.string.numeric(),
    },
  },
}));

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
            edges: bulk(buildShoppingListsNodeWith, 'WHATEVER_VALUES').times(1),
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
            role: 3,
          },
        }),
      },
    });

    const data = await window.b2b.utils.shoppingList.getLists();

    expect(data).toBeDefined();
    expect(data[0].id).toBeDefined();
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
            edges: bulk(buildShoppingListsNodeWith, 'WHATEVER_VALUES').times(1),
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

    expect(data).toBeDefined();
    expect(data[0].id).toBeDefined();
  });
});
