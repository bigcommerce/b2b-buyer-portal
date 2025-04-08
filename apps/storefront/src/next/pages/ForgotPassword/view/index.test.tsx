import { renderWithProviders, screen } from 'tests/test-utils';

import { View } from '.';

it('displays a heading of "Reset password"', async () => {
  renderWithProviders(<View />);

  screen.getByRole('heading', { name: 'Reset password' });
});

it('explains that automatic resets are not currently available', async () => {
  renderWithProviders(<View />);

  screen.getByText('Please contact Customer Support in order to reset your password.');
});
