import { renderWithProviders, screen, userEvent, within } from 'tests/test-utils';

import { View } from '.';

const mockedUseNavigate = vi.fn();
vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual<typeof import('react-router-dom')>('react-router-dom')),
  useNavigate: () => mockedUseNavigate,
}));

it('displays a heading of "Reset password"', async () => {
  renderWithProviders(<View resetPassword={vitest.fn()} />);

  screen.getByRole('heading', { name: 'Reset password' });
});

it('explains how the "Reset Password" process works', async () => {
  renderWithProviders(<View resetPassword={vitest.fn()} />);

  screen.getByText(
    'Fill in your email below to request a new password. An email will be sent to the address below containing a link to verify your email address.',
  );
});

it('displays an empty "Email address" field', async () => {
  renderWithProviders(<View resetPassword={vitest.fn()} />);

  screen.getByRole('textbox', { name: 'Email address' });
});

describe('when the user attempts to "Reset Password", but leaves "Email address" empty', () => {
  it('displays an "Email address is required" field error', async () => {
    renderWithProviders(<View resetPassword={vitest.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Reset Password' }));

    expect(await screen.findByText('Email address is required')).toBeInTheDocument();
  });
});

describe('when the user attempts to "Reset Password", but enters an invalid email address', () => {
  it('displays an "Email address is invalid" field error', async () => {
    renderWithProviders(<View resetPassword={vitest.fn()} />);

    await userEvent.type(screen.getByRole('textbox', { name: 'Email address' }), 'invalid-email');
    await userEvent.click(screen.getByRole('button', { name: 'Reset Password' }));

    expect(
      await screen.findByText('Please use a valid email address, such as user@example.com.'),
    ).toBeInTheDocument();
  });
});

describe('when the form is submitting', () => {
  it('disables the "Reset Password" button', async () => {
    renderWithProviders(
      <View resetPassword={vitest.fn().mockReturnValue(new Promise(() => undefined))} />,
    );

    await userEvent.type(screen.getByRole('textbox', { name: 'Email address' }), 'john@yahoo.com');
    await userEvent.click(screen.getByRole('button', { name: 'Reset Password' }));

    expect(await screen.findByRole('button', { name: 'Reset Password' })).toBeDisabled();
  });

  it('does not display any previous alerts', async () => {
    const resetPassword = vi
      .fn()
      .mockRejectedValueOnce(undefined)
      .mockReturnValue(new Promise(() => undefined));

    renderWithProviders(<View resetPassword={resetPassword} />);

    await userEvent.type(screen.getByRole('textbox', { name: 'Email address' }), 'john@yahoo.com');
    await userEvent.click(screen.getByRole('button', { name: 'Reset Password' }));

    const alert = await screen.findByRole('alert');

    await userEvent.click(screen.getByRole('button', { name: 'Reset Password' }));

    expect(alert).not.toBeInTheDocument();
  });
});

describe('when the submission fails', () => {
  it('displays an alert explaining the error', async () => {
    const resetPassword = vi.fn().mockRejectedValue(undefined);
    renderWithProviders(<View resetPassword={resetPassword} />);

    await userEvent.type(screen.getByRole('textbox', { name: 'Email address' }), 'john@yahoo.com');
    await userEvent.click(screen.getByRole('button', { name: 'Reset Password' }));

    const alert = await screen.findByRole('alert');
    expect(
      within(alert).getByText('Failed to process your request. Please try again later.'),
    ).toBeInTheDocument();
  });
});

describe('when the submission succeeds', () => {
  it('navigates to "/login?loginFlag=receivePassword"', async () => {
    const resetPassword = vi.fn().mockResolvedValue(undefined);
    renderWithProviders(<View resetPassword={resetPassword} />);

    await userEvent.type(screen.getByRole('textbox', { name: 'Email address' }), 'john@yahoo.com');
    await userEvent.click(screen.getByRole('button', { name: 'Reset Password' }));

    expect(mockedUseNavigate).toHaveBeenCalledWith('/login?loginFlag=receivePassword');
  });
});
