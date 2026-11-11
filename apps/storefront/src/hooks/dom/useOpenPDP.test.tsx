import { faker, renderWithProviders, screen, within } from 'tests/test-utils';

import GlobalDialog from '@/components/extraTip/GlobalDialog';
import { type SetOpenPage } from '@/pages/SetOpenPage';
import { useAppDispatch } from '@/store';
import { CustomerRole } from '@/types';

import { addProductFromPage, useShoppingListRegistrationPromptText } from './useOpenPDP';

interface AddToShoppingListButtonProps {
  role: number;
  registerEnabled: boolean;
  saveFn: () => void;
  setOpenPage: SetOpenPage;
}

function AddToShoppingListButton({
  role,
  registerEnabled,
  saveFn,
  setOpenPage,
}: AddToShoppingListButtonProps) {
  const registrationPromptText = useShoppingListRegistrationPromptText();
  const storeDispatch = useAppDispatch();

  return (
    <button
      type="button"
      onClick={() =>
        addProductFromPage({
          role,
          storeDispatch,
          saveFn,
          setOpenPage,
          registerEnabled,
          registrationPromptText,
        })
      }
    >
      Add to shopping list
    </button>
  );
}

const renderAddToShoppingList = ({
  role = CustomerRole.GUEST,
  registerEnabled = true,
  translations = {},
}: {
  role?: number;
  registerEnabled?: boolean;
  translations?: Record<string, string>;
} = {}) => {
  const saveFn = vi.fn();
  const setOpenPage = vi.fn();

  const view = renderWithProviders(
    <>
      <GlobalDialog />
      <AddToShoppingListButton
        role={role}
        registerEnabled={registerEnabled}
        saveFn={saveFn}
        setOpenPage={setOpenPage}
      />
    </>,
    {
      preloadedState: {
        lang: {
          translations,
          fetchedPages: [],
          translationVersion: 0,
          _persist: { version: 1, rehydrated: true },
        },
      },
    },
  );

  return { ...view, saveFn, setOpenPage };
};

describe('when a guest adds a product to a shopping list from the product page', () => {
  it('asks the guest to register or log in first', async () => {
    const { user } = renderAddToShoppingList();

    await user.click(screen.getByRole('button', { name: 'Add to shopping list' }));

    const dialog = await screen.findByRole('dialog');

    expect(within(dialog).getByText('Registration')).toBeInTheDocument();
    expect(
      within(dialog).getByText('Please create an account, or login to create a shopping list.'),
    ).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Register' })).toBeInTheDocument();
  });

  it('sends the guest to registration when they choose to register', async () => {
    const { user, saveFn } = renderAddToShoppingList();

    await user.click(screen.getByRole('button', { name: 'Add to shopping list' }));
    const dialog = await screen.findByRole('dialog');

    await user.click(within(dialog).getByRole('button', { name: 'Register' }));

    expect(saveFn).toHaveBeenCalledTimes(1);
  });

  it('shows the prompt in the translated copy', async () => {
    const translations = {
      'global.dialog.registration': faker.lorem.words(2),
      'global.dialog.shoppingListRegisterPrompt': faker.lorem.sentence(),
      'global.dialog.cancel': faker.lorem.word(),
      'global.dialog.register': faker.lorem.word(),
    };
    const { user } = renderAddToShoppingList({ translations });

    await user.click(screen.getByRole('button', { name: 'Add to shopping list' }));
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
    const { user } = renderAddToShoppingList({ registerEnabled: false });

    await user.click(screen.getByRole('button', { name: 'Add to shopping list' }));
    const dialog = await screen.findByRole('dialog');

    expect(within(dialog).getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(within(dialog).queryByRole('button', { name: 'Register' })).not.toBeInTheDocument();
  });
});

describe('when a logged-in buyer adds a product to a shopping list from the product page', () => {
  it('opens the product page flow without asking them to register', async () => {
    const { user, setOpenPage } = renderAddToShoppingList({ role: CustomerRole.ADMIN });

    await user.click(screen.getByRole('button', { name: 'Add to shopping list' }));

    expect(setOpenPage).toHaveBeenCalledWith({ isOpen: true, openUrl: '/pdp' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
