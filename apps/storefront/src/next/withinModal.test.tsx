import { renderWithProviders, screen, within, userEvent } from 'tests/test-utils';
import { withinModal } from './withinModal';

it('displays the component passed into it as the modal content', () => {
  const Component = () => 'I am the content of the modal';
  const ComponentWithinModal = withinModal(Component);

  renderWithProviders(<ComponentWithinModal setOpenPage={vitest.fn()} />);

  const modal = screen.getByRole('dialog');

  expect(within(modal).getByText('I am the content of the modal')).toBeInTheDocument();
});

it('calls setOpenPage when the close button is clicked', async () => {
  const ComponentWithinModal = withinModal(() => null);

  const setOpenPage = vitest.fn();

  renderWithProviders(<ComponentWithinModal setOpenPage={setOpenPage} />);

  const modal = screen.getByRole('dialog');
  const closeButton = within(modal).getByRole('button', { name: 'Close' });

  await userEvent.click(closeButton);

  expect(setOpenPage).toHaveBeenCalled();
});

describe('when the the site has a logo', () => {
  it('displays the logo', () => {
    const globalState = { logo: 'https://foo/bar.png' };
    const customText = { 'login.registerLogo': 'My lovely logo' };
    const ComponentWithinModal = withinModal(() => null);

    renderWithProviders(<ComponentWithinModal setOpenPage={vitest.fn()} />, {
      globalState,
      customText,
    });

    const modal = screen.getByRole('dialog');
    const logo = within(modal).getByRole('img', { name: 'My lovely logo' });

    expect(logo).toHaveAttribute('src', 'https://foo/bar.png');
  });

  describe('when the logo is clicked', () => {
    beforeEach(() => {
      window.location.href = '/some/non/homepage/url';
    });

    it('navigates to the homepage', async () => {
      const globalState = { logo: 'https://foo/bar.png' };
      const customText = { 'login.registerLogo': 'My lovely logo' };
      const ComponentWithinModal = withinModal(() => null);

      renderWithProviders(<ComponentWithinModal setOpenPage={vitest.fn()} />, {
        globalState,
        customText,
      });

      await userEvent.click(screen.getByRole('img', { name: 'My lovely logo' }));

      expect(window.location.pathname).toBe('/');
    });
  });
});

describe('when the the site does not have a logo', () => {
  it('does not display the logo', () => {
    const globalState = { logo: undefined };
    const customText = { 'login.registerLogo': 'My lovely logo' };
    const ComponentWithinModal = withinModal(() => null);

    renderWithProviders(<ComponentWithinModal setOpenPage={vitest.fn()} />, {
      globalState,
      customText,
    });

    const modal = screen.getByRole('dialog');
    const logo = within(modal).queryByRole('img', { name: 'My lovely logo' });

    expect(logo).not.toBeInTheDocument();
  });
});
