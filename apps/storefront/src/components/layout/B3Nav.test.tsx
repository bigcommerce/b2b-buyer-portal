import { useContext } from 'react';
import { buildCompanyStateWith } from 'tests/storeStateBuilders/companyStateBuilder';
import { faker, renderWithProviders, screen, within } from 'tests/test-utils';

import { DynamicallyVariableContext } from '@/shared/dynamicallyVariable';
import { CustomerRole } from '@/types';

import B3Nav from './B3Nav';

// B3Nav hands its prompt to the layout through this context, so the probe shows what the layout
// would render.
function GlobalMessageDialogProbe() {
  const {
    state: { globalMessageDialog },
  } = useContext(DynamicallyVariableContext);

  if (!globalMessageDialog.open) {
    return null;
  }

  return (
    <div role="dialog">
      <h2>{globalMessageDialog.title}</h2>
      <p>{globalMessageDialog.message}</p>
      <button type="button">{globalMessageDialog.cancelText}</button>
      {globalMessageDialog.saveText && (
        <button type="button">{globalMessageDialog.saveText}</button>
      )}
    </div>
  );
}

const renderGuestNav = ({
  registerEnabled = true,
  translations = {},
}: {
  registerEnabled?: boolean;
  translations?: Record<string, string>;
} = {}) =>
  renderWithProviders(
    <>
      <B3Nav />
      <GlobalMessageDialogProbe />
    </>,
    {
      preloadedState: {
        company: buildCompanyStateWith({
          customer: { role: CustomerRole.GUEST },
        }),
        lang: {
          translations,
          fetchedPages: [],
          translationVersion: 0,
          _persist: { version: 1, rehydrated: true },
        },
      },
      initialGlobalContext: {
        registerEnabled,
        storefrontConfig: {
          shoppingLists: true,
          tradeProfessionalApplication: false,
          quotes: true,
        },
        quoteConfig: [
          {
            key: 'shopping_list_on_product_page',
            value: '1',
            extraFields: { guest: true },
          },
          { key: 'quote_for_guest', value: '1', extraFields: {} },
        ],
      },
    },
  );

describe('when a guest opens a menu item that needs an account', () => {
  it('asks the guest to create an account or log in when opening shopping lists', async () => {
    const { user } = renderGuestNav();

    await user.click(await screen.findByRole('button', { name: 'Shopping lists' }));

    const dialog = await screen.findByRole('dialog');

    expect(within(dialog).getByText('Registration')).toBeInTheDocument();
    expect(
      within(dialog).getByText('Please create an account, or login to create a shopping list.'),
    ).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Register' })).toBeInTheDocument();
  });

  it('asks the guest to register for full access when opening any other page', async () => {
    const { user } = renderGuestNav();

    await user.click(await screen.findByRole('button', { name: 'Quotes' }));

    const dialog = await screen.findByRole('dialog');

    expect(
      within(dialog).getByText(
        'To receive full access to buyer portal, please register. It will take 2 minutes.',
      ),
    ).toBeInTheDocument();
  });

  it('shows the prompt in the translated copy', async () => {
    const translations = {
      'global.dialog.registration': faker.lorem.words(2),
      'global.dialog.shoppingListRegisterPrompt': faker.lorem.sentence(),
      'global.dialog.cancel': faker.lorem.word(),
      'global.dialog.register': faker.lorem.word(),
    };
    const { user } = renderGuestNav({ translations });

    await user.click(await screen.findByRole('button', { name: 'Shopping lists' }));
    const dialog = await screen.findByRole('dialog');

    expect(
      within(dialog).getByText(translations['global.dialog.registration']),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(translations['global.dialog.shoppingListRegisterPrompt']),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole('button', { name: translations['global.dialog.cancel'] }),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole('button', { name: translations['global.dialog.register'] }),
    ).toBeInTheDocument();
  });

  it('only offers to cancel when registration is disabled', async () => {
    const { user } = renderGuestNav({ registerEnabled: false });

    await user.click(await screen.findByRole('button', { name: 'Shopping lists' }));
    const dialog = await screen.findByRole('dialog');

    expect(within(dialog).getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(within(dialog).queryByRole('button', { name: 'Register' })).not.toBeInTheDocument();
  });
});
