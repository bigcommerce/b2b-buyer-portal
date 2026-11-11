import {
  act,
  buildCompanyStateWith,
  builder,
  faker,
  graphql,
  HttpResponse,
  renderWithProviders,
  screen,
  startMockServer,
  stringContainingAll,
  within,
} from 'tests/test-utils';
import { when } from 'vitest-when';

import GlobalDialog from '@/components/extraTip/GlobalDialog';
import { ShoppingListsItemsProps } from '@/pages/ShoppingLists/config';
import { getGlobalTranslations } from '@/store/appAsyncThunks';
import { CustomerRole } from '@/types';

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

describe('HeadlessController shopping list registration prompt', () => {
  it('shows translations that arrive after the headless API was registered', async () => {
    const translations = {
      'global.dialog.registration': faker.lorem.words(2),
      'global.dialog.shoppingListRegisterPrompt': faker.lorem.sentence(),
    };
    const newVersion = faker.number.int({ min: 1 });

    const { store } = renderWithProviders(
      <>
        <HeadlessController setOpenPage={vi.fn()} />
        <GlobalDialog />
      </>,
      {
        preloadedState: {
          company: buildCompanyStateWith({ customer: { role: CustomerRole.GUEST } }),
        },
      },
    );

    // The store is updated from outside React's event handlers, so it has to be flushed explicitly
    act(() => {
      store.dispatch(
        getGlobalTranslations.fulfilled(
          { globalTranslations: translations, newVersion, multiLanguageEnabled: false },
          faker.string.uuid(),
          { channelId: faker.number.int(), newVersion },
        ),
      );
    });

    window.b2b.utils.shoppingList.addProductFromPage({
      productEntityId: faker.number.int(),
      quantity: faker.number.int({ min: 1, max: 10 }),
    });

    const dialog = await screen.findByRole('dialog');

    expect(
      within(dialog).getByText(translations['global.dialog.registration']),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(translations['global.dialog.shoppingListRegisterPrompt']),
    ).toBeInTheDocument();
  });
});
